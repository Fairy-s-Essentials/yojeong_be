import { GoogleGenAI } from '@google/genai';
import { getPrompt, UserInput } from '../utils/prompt.util';

class GeminiService {
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
   * 텍스트 입력을 받아 AI 응답을 생성하는 메서드.
   * @param prompt - 입력 텍스트
   * @returns AI 생성 텍스트 응답
   */
  async generateContent(userInput: UserInput) {
    const prompt = getPrompt({ ...userInput, numOfCharacter: 300 });

    try {
      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            aiSummary: 'string',
            similarity: 'number',
            reason: 'string'
          }
        }
      });
      console.log('response', response);
      const parsedResponse = JSON.parse(response?.text || '{}');
      console.log('-------------------------------');
      return parsedResponse;
    } catch (error) {
      console.error('Gemini API 호출 중 오류 발생:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('AI 응답 생성에 실패했습니다.');
    }
  }

  generatePrompt(input: string) {}
}

export default new GeminiService();
