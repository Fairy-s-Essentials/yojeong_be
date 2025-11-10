import { GoogleGenAI } from '@google/genai';
import {
  getAiSummaryPrompt,
  getPrompt,
  getSummaryEvaluationPrompt
} from '../utils/prompt.util';
import { getAiSummaryNumOfCharacterByOriginalText } from '../utils/summary.util';
import { GeminiGenerateContentProps } from '../types/gemini';

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

  /**
   * 텍스트 입력을 받아 AI 응답을 생성하는 메서드.
   * @param prompt - 입력 텍스트
   * @returns AI 생성 텍스트 응답
   */
  // async generateContent(userInput: GeminiGenerateContentProps) {
  //   const numOfCharacter = getAiSummaryNumOfCharacterByOriginalText(
  //     userInput.originalText
  //   );
  //   const prompt = getPrompt({ ...userInput, numOfCharacter });

  //   try {
  //     const response = await this.genAI.models.generateContent({
  //       model: this.model,
  //       contents: prompt,
  //       config: {
  //         responseMimeType: 'application/json',
  //         responseJsonSchema: {
  //           aiSummary: 'string',
  //           similarityScore: 'number',
  //           aiWellUnderstood: 'string[]',
  //           aiMissedPoints: 'string[]',
  //           aiImprovements: 'string[]'
  //         }
  //       }
  //     });

  //     const parsedResponse = JSON.parse(response?.text || '{}');
  //     console.log('parsedResponse', parsedResponse);
  //     return parsedResponse;
  //   } catch (error) {
  //     console.error('Gemini API 호출 중 오류 발생:', error);
  //     if (error instanceof Error) {
  //       throw new Error(error.message);
  //     }
  //     throw new Error('AI 응답 생성에 실패했습니다.');
  //   }
  // }
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
          aiSummary: 'string'
        }
      }
    });
    const parsedResponse = JSON.parse(response?.text || '{}');
    return parsedResponse;
  }

  async summaryEvaluation(
    originalText: string,
    userSummary: string,
    aiSummary: string
  ) {
    const prompt = getSummaryEvaluationPrompt(
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
          similarityScore: 'number',
          aiWellUnderstood: 'string[]',
          aiMissedPoints: 'string[]',
          aiImprovements: 'string[]'
        }
      }
    });
    const parsedResponse = JSON.parse(response?.text || '{}');
    return parsedResponse;
  }
}

export default new GeminiService();
