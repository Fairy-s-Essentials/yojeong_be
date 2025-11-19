import { SUMMARY_NUM_OF_CHARACTER } from '../constant/summary.const';
import {
  LOGIC_QUALITY_SCORES,
  EXPRESSION_ACCURACY_SCORES,
  CRITICAL_THINKING_SCORES,
  SCORE_WEIGHTS
} from '../constant/evaluation.const';
import {
  StructuredEvaluation,
} from '../types/summary';

/**
 * 원문 텍스트의 길이에 따라 AI 요약 길이를 반환하는 함수
 * @param text - 원문 텍스트
 * @returns AI 요약 길이
 */
export const getAiSummaryNumOfCharacterByOriginalText = (text: string) => {
  // 공백(스페이스/탭/개행 등) 제외 문자수 세기
  const charCount = text.replace(/\s/g, '').length;

  if (charCount <= SUMMARY_NUM_OF_CHARACTER.SHORT.ORIGINAL_TEXT) {
    return SUMMARY_NUM_OF_CHARACTER.SHORT.AI_SUMMARY;
  }

  if (charCount <= SUMMARY_NUM_OF_CHARACTER.MEDIUM.ORIGINAL_TEXT) {
    return SUMMARY_NUM_OF_CHARACTER.MEDIUM.AI_SUMMARY;
  }

  return SUMMARY_NUM_OF_CHARACTER.LONG.AI_SUMMARY;
};

/**
 * 여러 요약 중 목표 길이에 가장 가까운 요약을 선택하는 함수
 * 목표 길이보다 긴 경우 패널티(×3)를 적용하여 짧은 요약을 선호
 * @param summaries - 요약 텍스트 배열
 * @param targetLength - 목표 길이
 * @returns 목표 길이에 가장 가까운 요약
 */
export const selectClosestSummary = (
  summaries: string[],
  targetLength: number
): string => {
  return summaries.reduce((closest: string, current: string) => {
    if (!closest) return current;

    const calculateWeightedDiff = (length: number) => {
      const diff = Math.abs(length - targetLength);
      return length > targetLength ? diff * 3 : diff;
    };

    const closestDiff = calculateWeightedDiff(closest.length);
    const currentDiff = calculateWeightedDiff(current.length);

    return currentDiff < closestDiff ? current : closest;
  }, '');
};

/**
 * LLM의 구조화된 평가 결과를 바탕으로 최종 similarityScore를 계산하는 함수
 * @param evaluation - LLM이 반환한 구조화된 평가 결과
 * @param hasCriticalReading - 비판적 읽기 여부
 * @returns 최종 similarityScore (0-100)
 */
export const calculateSimilarityScore = (
  evaluation: StructuredEvaluation,
  hasCriticalReading: boolean
): number => {
  const {
    keyPoints,
    userCoverage,
    logicQuality,
    expressionAccuracy,
    criticalThinking
  } = evaluation;

  // 1. 핵심 포인트 포함도 계산
  const keyPointsCovered = userCoverage.filter(Boolean).length;
  const totalKeyPoints = keyPoints.length;

  // 0으로 나누기 방지
  const coverageRatio =
    totalKeyPoints > 0 ? keyPointsCovered / totalKeyPoints : 0;

  // 2. 배점 가져오기
  const weights = hasCriticalReading
    ? SCORE_WEIGHTS.WITH_CRITICAL
    : SCORE_WEIGHTS.WITHOUT_CRITICAL;

  // 3. 각 항목별 점수 계산
  const coverageScore = coverageRatio * weights.COVERAGE;
  const logicScore =
    LOGIC_QUALITY_SCORES[logicQuality].percentage * weights.LOGIC;
  const expressionScore =
    EXPRESSION_ACCURACY_SCORES[expressionAccuracy].percentage *
    weights.EXPRESSION;

  let totalScore = coverageScore + logicScore + expressionScore;

  // 4. 비판적 사고 점수 추가 (있는 경우)
  if (hasCriticalReading && criticalThinking) {
    const weightsWithCritical = weights as typeof SCORE_WEIGHTS.WITH_CRITICAL;
    const criticalScore =
      CRITICAL_THINKING_SCORES[criticalThinking].percentage *
      weightsWithCritical.CRITICAL;
    totalScore += criticalScore;
  }

  // 5. 반올림하여 정수로 반환 (0-100 범위)
  return Math.round(Math.max(0, Math.min(100, totalScore)));
};
