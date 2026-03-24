export type ExtractStatus =
  | 'success'
  | 'truncated'
  | 'insufficient_content'
  | 'fetch_failed';

export interface ExtractResult {
  status: ExtractStatus;
  content: string | null;
}
