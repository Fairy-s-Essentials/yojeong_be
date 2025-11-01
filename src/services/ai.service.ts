import { SummaryInput, AiSummaryResponse } from "../types/summary";

/**
 * AI 분석 서비스 
 */
export  function analyzeUserSummary(input: SummaryInput): AiSummaryResponse {
  try {
    // TODO: 실제 AI 연결 필요

    // 데이터 반환
    return {
      aiSummary: 'AI 요약',
      similarityScore: 80,
      aiWellUnderstood: ["잘 파악한 것"],
      aiMissedPoints: ["놓친 포인트"],
      aiImprovements: ["개선 제안"],
    };
  } catch (error) {
    console.error("AI 분석 중 오류:", error);
    throw new Error("AI_SERVICE_ERROR");
  }
}
