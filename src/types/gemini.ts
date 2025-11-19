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
  aiWellUnderstood: string[];
  aiMissedPoints: string[];
  aiImprovements: string[];
}
