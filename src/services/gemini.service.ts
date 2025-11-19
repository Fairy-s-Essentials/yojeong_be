import { GoogleGenAI } from '@google/genai';
import {
  getAiSummaryPrompt,
  getSummaryEvaluationPrompt
} from '../utils/prompt.util';
import {
  getAiSummaryNumOfCharacterByOriginalText,
  selectClosestSummary
} from '../utils/summary.util';

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
        }
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
