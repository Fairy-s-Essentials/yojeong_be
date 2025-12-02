import { GoogleGenAI } from '@google/genai';
import {
  getAiSummaryPrompt,
  getKeyPointsPrompt,
  getLogicEvaluationPrompt,
  getExpressionEvaluationPrompt,
  getCriticalThinkingPrompt,
  getFeedbackPrompt
} from '../utils/prompt.util';
import {
  getAiSummaryNumOfCharacterByOriginalText,
  selectClosestSummary,
  calculateSimilarityScore
} from '../utils/summary.util';
import {
  KeyPointsEvaluation,
  LogicEvaluation,
  ExpressionEvaluation,
  CriticalThinkingEvaluation,
  FeedbackEvaluation,
  IntegratedEvaluation
} from '../types/summary';
import { GeminiResponse } from '../types/gemini';

class GeminiService {
  private readonly genAI: GoogleGenAI;
  // private readonly model: string = 'gemini-2.5-flash-lite';
  private readonly model: string = 'gemini-2.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async aiSummary(originalText: string) {
    const numOfCharacter =
      getAiSummaryNumOfCharacterByOriginalText(originalText);
    const prompt = getAiSummaryPrompt(originalText, numOfCharacter);
    const response = await this.genAI.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          aiSummaries: 'string[]'
        },
        temperature: 0.3,
        topK: 10,
        topP: 0.5
      }
    });
    const parsedResponse = JSON.parse(response?.text || '{}');
    const summaries = parsedResponse.aiSummaries || [];

    const selectedSummary = selectClosestSummary(summaries, numOfCharacter);

    return { aiSummary: selectedSummary };
  }

  /**
   * 핵심 포인트 추출 평가
   */
  private async evaluateKeyPoints(
    originalText: string,
    userSummary: string,
    aiSummary: string
  ): Promise<KeyPointsEvaluation> {
    try {
      const prompt = getKeyPointsPrompt(originalText, userSummary, aiSummary);
      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            keyPoints: 'string[]',
            userCoverage: 'boolean[]'
          },
          temperature: 0,
          topK: 1,
          topP: 0.1
        }
      });

      const result: KeyPointsEvaluation = JSON.parse(response?.text || '{}');

      // 필수 필드 검증
      if (!result.keyPoints || !result.userCoverage) {
        console.error('핵심 포인트 평가 응답 형식 오류:', result);
        throw new Error('AI_SERVICE_ERROR: 핵심 포인트 평가 형식이 올바르지 않습니다.');
      }

      // 배열 길이 검증
      if (result.keyPoints.length !== result.userCoverage.length) {
        console.error(
          'keyPoints와 userCoverage 길이 불일치:',
          result.keyPoints.length,
          'vs',
          result.userCoverage.length
        );
        throw new Error('AI_SERVICE_ERROR: 핵심 포인트 평가 데이터가 일치하지 않습니다.');
      }

      return result;
    } catch (error: unknown) {
      console.error('핵심 포인트 평가 중 오류:', error);
      throw new Error('AI_SERVICE_ERROR: 핵심 포인트 평가 실패');
    }
  }

  /**
   * 논리 흐름 평가
   */
  private async evaluateLogic(
    originalText: string,
    userSummary: string,
    aiSummary: string
  ): Promise<LogicEvaluation> {
    try {
      const prompt = getLogicEvaluationPrompt(
        originalText,
        userSummary,
        aiSummary
      );
      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            analysis: 'string',
            quality: 'string'
          },
          temperature: 0,
          topK: 1,
          topP: 0.1
        }
      });

      const result: LogicEvaluation = JSON.parse(response?.text || '{}');

      // 필수 필드 검증
      if (!result.analysis || !result.quality) {
        console.error('논리 흐름 평가 응답 형식 오류:', result);
        throw new Error('AI_SERVICE_ERROR: 논리 흐름 평가 형식이 올바르지 않습니다.');
      }

      return result;
    } catch (error: unknown) {
      console.error('논리 흐름 평가 중 오류:', error);
      throw new Error('AI_SERVICE_ERROR: 논리 흐름 평가 실패');
    }
  }

  /**
   * 표현 정확성 평가
   */
  private async evaluateExpression(
    originalText: string,
    userSummary: string,
    aiSummary: string
  ): Promise<ExpressionEvaluation> {
    try {
      const prompt = getExpressionEvaluationPrompt(
        originalText,
        userSummary,
        aiSummary
      );
      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            analysis: 'string',
            accuracy: 'string'
          },
          temperature: 0,
          topK: 1,
          topP: 0.1
        }
      });

      const result: ExpressionEvaluation = JSON.parse(response?.text || '{}');

      // 필수 필드 검증
      if (!result.analysis || !result.accuracy) {
        console.error('표현 정확성 평가 응답 형식 오류:', result);
        throw new Error('AI_SERVICE_ERROR: 표현 정확성 평가 형식이 올바르지 않습니다.');
      }

      return result;
    } catch (error: unknown) {
      console.error('표현 정확성 평가 중 오류:', error);
      throw new Error('AI_SERVICE_ERROR: 표현 정확성 평가 실패');
    }
  }

  /**
   * 비판적 사고 평가
   */
  private async evaluateCriticalThinking(
    originalText: string,
    userSummary: string,
    aiSummary: string,
    criticalWeakness?: string,
    criticalOpposite?: string
  ): Promise<CriticalThinkingEvaluation> {
    try {
      const prompt = getCriticalThinkingPrompt(
        originalText,
        userSummary,
        aiSummary,
        criticalWeakness,
        criticalOpposite
      );
      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            analysis: 'string',
            thinking: 'string'
          },
          temperature: 0,
          topK: 1,
          topP: 0.1
        }
      });

      const result: CriticalThinkingEvaluation = JSON.parse(
        response?.text || '{}'
      );

      // 필수 필드 검증
      if (!result.analysis || !result.thinking) {
        console.error('비판적 사고 평가 응답 형식 오류:', result);
        throw new Error('AI_SERVICE_ERROR: 비판적 사고 평가 형식이 올바르지 않습니다.');
      }

      return result;
    } catch (error: unknown) {
      console.error('비판적 사고 평가 중 오류:', error);
      throw new Error('AI_SERVICE_ERROR: 비판적 사고 평가 실패');
    }
  }

  /**
   * 피드백 생성
   */
  private async generateFeedback(
    originalText: string,
    userSummary: string,
    aiSummary: string,
    keyPoints: KeyPointsEvaluation,
    logic: LogicEvaluation,
    expression: ExpressionEvaluation,
    critical?: CriticalThinkingEvaluation
  ): Promise<FeedbackEvaluation> {
    try {
      const prompt = getFeedbackPrompt(
        originalText,
        userSummary,
        aiSummary,
        keyPoints.keyPoints,
        keyPoints.userCoverage,
        logic.analysis,
        logic.quality,
        expression.analysis,
        expression.accuracy,
        critical?.analysis,
        critical?.thinking
      );
      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            wellUnderstood: 'string[]',
            missedPoints: 'string[]',
            improvements: 'string[]'
          },
          temperature: 0,
          topK: 1,
          topP: 0.1
        }
      });

      const result: FeedbackEvaluation = JSON.parse(response?.text || '{}');

      // 필수 필드 검증
      if (
        !result.wellUnderstood ||
        !result.missedPoints ||
        !result.improvements
      ) {
        console.error('피드백 생성 응답 형식 오류:', result);
        throw new Error('AI_SERVICE_ERROR: 피드백 생성 형식이 올바르지 않습니다.');
      }

      return result;
    } catch (error: unknown) {
      console.error('피드백 생성 중 오류:', error);
      throw new Error('AI_SERVICE_ERROR: 피드백 생성 실패');
    }
  }

  async summaryEvaluation(
    originalText: string,
    userSummary: string,
    aiSummary: string,
    criticalWeakness?: string,
    criticalOpposite?: string
  ): Promise<GeminiResponse> {
    try {
      const hasCriticalReading = !!(criticalWeakness || criticalOpposite);

      // 1-4단계: 병렬 평가 실행
      const [keyPoints, logic, expression, critical] = await Promise.all([
        this.evaluateKeyPoints(originalText, userSummary, aiSummary),
        this.evaluateLogic(originalText, userSummary, aiSummary),
        this.evaluateExpression(originalText, userSummary, aiSummary),
        hasCriticalReading
          ? this.evaluateCriticalThinking(
              originalText,
              userSummary,
              aiSummary,
              criticalWeakness,
              criticalOpposite
            )
          : Promise.resolve(undefined)
      ]);

      // 5단계: 평가 결과를 종합하여 피드백 생성
      const feedback = await this.generateFeedback(
        originalText,
        userSummary,
        aiSummary,
        keyPoints,
        logic,
        expression,
        critical
      );

      // IntegratedEvaluation 구성
      const integratedEvaluation: IntegratedEvaluation = {
        keyPoints,
        logic,
        expression,
        ...(critical && { critical }),
        feedback
      };

      // 최종 점수 계산 (IntegratedEvaluation 직접 사용)
      const similarityScore = calculateSimilarityScore(
        integratedEvaluation,
        hasCriticalReading,
        userSummary,
        aiSummary
      );

      // GeminiResponse 형식으로 반환
      return {
        aiSummary,
        similarityScore,
        aiWellUnderstood: integratedEvaluation.feedback.wellUnderstood,
        aiMissedPoints: integratedEvaluation.feedback.missedPoints,
        aiImprovements: integratedEvaluation.feedback.improvements
      };
    } catch (error: unknown) {
      console.error('요약 평가 중 오류 발생:', error);

      // Error 타입 체크
      if (error instanceof Error) {
        // AI_SERVICE_ERROR가 아닌 경우 래핑
        if (!error.message?.startsWith('AI_SERVICE_ERROR')) {
          throw new Error('AI_SERVICE_ERROR: 요약 평가 중 예기치 않은 오류가 발생했습니다.');
        }
        // AI_SERVICE_ERROR인 경우 그대로 전파
        throw error;
      }

      // Error 타입이 아닌 경우
      throw new Error('AI_SERVICE_ERROR: 요약 평가 중 예기치 않은 오류가 발생했습니다.');
    }
  }
}

export default new GeminiService();
