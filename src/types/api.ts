/**
 * API 응답 공통 타입
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
}