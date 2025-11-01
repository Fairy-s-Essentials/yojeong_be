import { SummaryInput } from '../types/summary';

interface ValidationError {
  [key: string]: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError;
}

/**
 * 문자열이 비어있는지 확인
 */
const isEmpty = (value: any): boolean => {
  return !value || typeof value !== 'string' || value.trim() === '';
};

/**
 * 원문 길이에 따라 요약 최대 길이 계산
 */
const getMaxSummaryLength = (textLength: number): number | null => {
  if (textLength >= 1000 && textLength < 2000) return 300;
  if (textLength >= 2000 && textLength < 3500) return 450;
  if (textLength >= 3500 && textLength <= 5000) return 600;
  return null;
};

/**
 * Summary 생성 입력값 검증
 */
export function validateSummaryInput(input: SummaryInput): ValidationResult {
  const errors: ValidationError = {};

  // originalText 검증
  if (isEmpty(input.originalText)) {
    errors.originalText = '원문은 필수 입력값입니다.';
  } else if (
    input.originalText.length < 1000 ||
    input.originalText.length > 5000
  ) {
    errors.originalText = '원문은 1000자 이상 5000자 이하여야 합니다.';
  }

  // userSummary 검증
  if (isEmpty(input.userSummary)) {
    errors.userSummary = '요약은 필수 입력값입니다.';
  } else {
    const maxLength = getMaxSummaryLength(input.originalText.length);
    
    if (maxLength && input.userSummary.length > maxLength) {
      errors.userSummary = `요약은 ${maxLength}자 이하여야 합니다.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
