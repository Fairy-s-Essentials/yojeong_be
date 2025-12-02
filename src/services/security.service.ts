import { GoogleGenAI } from '@google/genai';
import { getPromptInjectionCheckPrompt } from '../utils/prompt.util';

/**
 * 프롬프트 인젝션 검증 결과
 */
export interface PromptInjectionCheckResult {
  isSafe: boolean;
  reason: string;
}

/**
 * 보안 검증 서비스
 */
class SecurityService {
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
   * 프롬프트 인젝션 시도 검증
   * @param userSummary 사용자 요약
   * @param criticalWeakness 비판적 읽기 - 약점 분석
   * @param criticalOpposite 비판적 읽기 - 반대 의견
   * @returns 검증 결과
   */
  async checkPromptInjection(
    userSummary: string,
    criticalWeakness?: string,
    criticalOpposite?: string
  ): Promise<PromptInjectionCheckResult> {
    try {
      const prompt = getPromptInjectionCheckPrompt(
        userSummary,
        criticalWeakness,
        criticalOpposite
      );

      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            isSafe: 'boolean',
            reason: 'string'
          },
          temperature: 0,
          topK: 1,
          topP: 0.1
        }
      });

      const result: PromptInjectionCheckResult = JSON.parse(
        response?.text || '{"isSafe": true, "reason": "검증 실패"}'
      );

      // 필수 필드 검증
      if (typeof result.isSafe !== 'boolean' || !result.reason) {
        console.error('프롬프트 인젝션 검증 응답 형식 오류:', result);
        // 기본적으로 안전하다고 간주 (false positive 방지)
        return {
          isSafe: true,
          reason: '검증 응답 형식 오류로 안전하다고 간주합니다.'
        };
      }

      return result;
    } catch (error: unknown) {
      console.error('프롬프트 인젝션 검증 중 오류:', error);
      // 에러 발생 시 안전하다고 간주 (서비스 가용성 우선)
      return {
        isSafe: true,
        reason: '검증 서비스 오류로 안전하다고 간주합니다.'
      };
    }
  }
}

export default new SecurityService();

