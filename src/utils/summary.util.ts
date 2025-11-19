import { SUMMARY_NUM_OF_CHARACTER } from '../constant/summary.const';

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
