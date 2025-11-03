import { CreateSummaryReqBody } from './summary';

export type GeminiGenerateContentProps = Omit<
  CreateSummaryReqBody,
  'originalUrl' | 'difficultyLevel'
>;

export type GeminiPromptInput = GeminiGenerateContentProps & {
  numOfCharacter: number;
};

export interface GeminiResponse {
  aiSummary: string;
  similarityScore: number;
  aiWellUnderstood: [string, string, string];
  aiMissedPoints: [string, string, string];
  aiImprovements: [string, string, string];
}
