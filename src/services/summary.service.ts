import { pool } from "../config/db";
import { analyzeUserSummary } from "./ai.service";
import { SummaryInput, SummaryResponse } from "../types/summary";
import { insertUserInput, findSummaryById, updateAIAnalysis } from "../models/summary.model";

export async function getTestSummary() {
  try {
    const result = await pool.query("SELECT * FROM summaries LIMIT 1");
    return result[0] || [{ id: 0, summary: "테스트지롱" }];
  } catch (error) {
    console.error("Summary 조회 실패:", error);
    throw error;
  }
}

/**
 * 사용자 요약 생성 및 AI 분석
 */
export async function createSummary(
  input: SummaryInput
): Promise<SummaryResponse> {
  try {
    // 사용자 입력값 DB에 저장
    const summaryId = await insertUserInput(input);

    // AI 분석
    const aiAnalysis = analyzeUserSummary(input);

    // AI 분석 결과를 DB에 업데이트
    await updateAIAnalysis(summaryId, {
      aiSummary: aiAnalysis.aiSummary,
      similarityScore: aiAnalysis.similarityScore,
      aiWellUnderstood: aiAnalysis.aiWellUnderstood,
      aiMissedPoints: aiAnalysis.aiMissedPoints,
      aiImprovements: aiAnalysis.aiImprovements,
    });

    // 생성된 데이터 조회
    const savedSummary = await findSummaryById(summaryId);

    if (!savedSummary) {
      throw new Error("요약 정보를 찾을 수 없습니다.");
    }

    // 응답 형식으로 변환
    return {
      id: savedSummary.id,
      userId: savedSummary.user_id,
      originalText: savedSummary.original_text,
      originalUrl: savedSummary.original_url,
      difficultyLevel: savedSummary.difficulty_level,
      userSummary: savedSummary.user_summary,
      criticalWeakness: savedSummary.critical_weakness,
      criticalOpposite: savedSummary.critical_opposite,
      criticalApplication: savedSummary.critical_application,
      aiSummary: savedSummary.ai_summary,
      similarityScore: savedSummary.similarity_score,
      aiWellUnderstood: savedSummary.ai_well_understood,
      aiMissedPoints: savedSummary.ai_missed_points,
      aiImprovements: savedSummary.ai_improvements,
      learningNote: savedSummary.learning_note || null,
      createdAt: savedSummary.created_at,
    };
  } catch (error) {
    console.error("Summary 생성 실패:", error);
    throw error;
  }
}