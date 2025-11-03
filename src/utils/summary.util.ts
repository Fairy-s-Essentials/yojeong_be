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
