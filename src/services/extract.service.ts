import axios from 'axios';
import * as cheerio from 'cheerio';
import { ExtractResult } from '../types/extract';
import { MIN_CONTENT_LENGTH, MAX_CONTENT_LENGTH } from '../constant/extract.const';
import { extractText } from '../utils/extract.util';

export const extractContentFromUrl = async (
  url: string
): Promise<ExtractResult> => {
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

    const $ = cheerio.load(html);
    const content = extractText($);

    if (content.length < MIN_CONTENT_LENGTH) {
      return { status: 'insufficient_content', content: content || null };
    }

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
};
