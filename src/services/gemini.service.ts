import { GoogleGenAI } from '@google/genai';
import {
  getAiSummaryPrompt,
  getSummaryEvaluationPrompt
} from '../utils/prompt.util';
import {
  getAiSummaryNumOfCharacterByOriginalText,
  selectClosestSummary,
  calculateSimilarityScore
} from '../utils/summary.util';
import { StructuredEvaluation } from '../types/summary';
import { GeminiResponse } from '../types/gemini';

class GeminiService {
  private readonly genAI: GoogleGenAI;
  private readonly model: string = 'gemini-2.5-flash-lite';
  // private readonly model: string = 'gemini-2.5-pro';

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

  async summaryEvaluation(
    originalText: string,
    userSummary: string,
    aiSummary: string,
    criticalWeakness?: string,
    criticalOpposite?: string
  ): Promise<GeminiResponse> {
    const hasCriticalReading = !!(criticalWeakness || criticalOpposite);

    const prompt = getSummaryEvaluationPrompt(
      originalText,
      userSummary,
      aiSummary,
      criticalWeakness,
      criticalOpposite
    );

    // 비판적 읽기 여부에 따라 다른 스키마 사용
    const baseSchema = {
      keyPoints: 'string[]',
      userCoverage: 'boolean[]',
      logicAnalysis: 'string',
      expressionAnalysis: 'string',
      logicQuality: 'string',
      expressionAccuracy: 'string',
      aiWellUnderstood: 'string[]',
      aiMissedPoints: 'string[]',
      aiImprovements: 'string[]'
    };

    const schemaWithCritical = {
      ...baseSchema,
      criticalAnalysis: 'string',
      criticalThinking: 'string'
    };

    const response = await this.genAI.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: hasCriticalReading
          ? schemaWithCritical
          : baseSchema,
        temperature: 0,      
        topK: 1,            
        topP: 0.1
      }
    });

    const structuredEvaluation: StructuredEvaluation = JSON.parse(
      response?.text || '{}'
    );

    // 필수 데이터 검증
    if (
      !structuredEvaluation.keyPoints ||
      !structuredEvaluation.userCoverage ||
      !structuredEvaluation.logicQuality ||
      !structuredEvaluation.expressionAccuracy
    ) {
      console.error('LLM 응답 형식 오류:', structuredEvaluation);
      throw new Error(
        'AI_SERVICE_ERROR: LLM이 예상과 다른 형식으로 응답했습니다.'
      );
    }

    // 배열 길이 일치 검증
    if (
      structuredEvaluation.keyPoints.length !==
      structuredEvaluation.userCoverage.length
    ) {
      console.error(
        'keyPoints와 userCoverage 길이 불일치:',
        structuredEvaluation.keyPoints.length,
        'vs',
        structuredEvaluation.userCoverage.length
      );
      throw new Error(
        'AI_SERVICE_ERROR: 평가 데이터가 올바르지 않습니다.'
      );
    }

    // 서버에서 최종 점수 계산
    const similarityScore = calculateSimilarityScore(
      structuredEvaluation,
      hasCriticalReading,
      userSummary,
      aiSummary
    );

    // 기존 GeminiResponse 형식으로 반환
    return {
      aiSummary,
      similarityScore,
      aiWellUnderstood: structuredEvaluation.aiWellUnderstood,
      aiMissedPoints: structuredEvaluation.aiMissedPoints,
      aiImprovements: structuredEvaluation.aiImprovements
    };
  }
}

export default new GeminiService();
