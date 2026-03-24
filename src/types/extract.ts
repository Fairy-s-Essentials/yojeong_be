export type ExtractStatus =
  | 'success'
  | 'truncated'
  | 'under_limit'
  | 'unsuitable_content'
  | 'fetch_failed';

export interface ExtractResult {
  status: ExtractStatus;
  content: string | null;
}
