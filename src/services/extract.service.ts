import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import { ExtractResult } from '../types/extract';
import {
  MIN_CONTENT_LENGTH,
  MAX_CONTENT_LENGTH
} from '../constant/extract.const';
import { extractText } from '../utils/extract.util';
import { getContentQualityCheckPrompt } from '../utils/prompt.util';

class ExtractService {
  private readonly genAI: GoogleGenAI;
  private readonly model: string = 'gemini-2.5-flash-lite';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * AI를 활용한 콘텐츠 품질 검증
   * 요약하기에 적합한 본문인지 판단
   */
  private async checkContentQuality(
    content: string
  ): Promise<{ isSuitable: boolean; reason: string }> {
    try {
      const prompt = getContentQualityCheckPrompt(content);
      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            isSuitable: 'boolean',
            reason: 'string'
          },
          temperature: 0,
          topK: 1,
          topP: 0.1
        }
      });

      const result = JSON.parse(
        response?.text || '{"isSuitable": true, "reason": "검증 실패"}'
      );

      if (typeof result.isSuitable !== 'boolean' || !result.reason) {
        console.error('콘텐츠 품질 검증 응답 형식 오류:', result);
        return {
          isSuitable: true,
          reason: '검증 응답 형식 오류로 적합하다고 간주합니다.'
        };
      }

      return result;
    } catch (error) {
      console.error('콘텐츠 품질 검증 중 오류:', error);
      return {
        isSuitable: true,
        reason: '검증 서비스 오류로 적합하다고 간주합니다.'
      };
    }
  }

  /**
   * URL에서 원문 추출 및 품질 검증
   */
  async extractContentFromUrl(url: string): Promise<ExtractResult> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; YojeongBot/1.0)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
        },
        maxRedirects: 5,
        responseType: 'text'
      });

      const html = response.data;
      if (!html || typeof html !== 'string') {
        return { status: 'fetch_failed', content: null };
      }

      // HTML 파싱 → 본문 텍스트 추출
      const $ = cheerio.load(html);
      const content = extractText($);

      // 1000자 미만이면 요약 불가
      if (content.length < MIN_CONTENT_LENGTH) {
        return { status: 'under_limit', content: null };
      }

      // AI가 요약 적합성 판단
      const qualityCheck = await this.checkContentQuality(content);
      if (!qualityCheck.isSuitable) {
        return { status: 'unsuitable_content', content: null };
      }

      // 원문 5000자 제한 적용
      if (content.length > MAX_CONTENT_LENGTH) {
        return {
          status: 'truncated',
          content: content.slice(0, MAX_CONTENT_LENGTH)
        };
      }

      return { status: 'success', content };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          `URL 접근 실패 [${error.response?.status || 'NETWORK'}]: ${url}`
        );
      } else {
        console.error('원문 추출 중 오류:', error);
      }
      return { status: 'fetch_failed', content: null };
    }
  }
}

export default new ExtractService();
