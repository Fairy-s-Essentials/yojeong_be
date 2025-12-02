import { CreateSummaryReqBody } from '../types/summary';
import { validateSummaryInput } from '../utils/validation.util';
import securityService from './security.service';

/**
 * 통합 검증 결과
 */
export interface ValidationResult {
  isValid: boolean;
  code?: string;
  message: string;
  details?: string;
}

/**
 * 통합 검증 서비스
 * 기본 입력값 검증 + 보안 검증을 수행
 */
class ValidationService {
  /**
   * 요약 생성 요청 전체 검증
   * @param input 사용자 입력 데이터
   * @returns 검증 결과
   */
  async validateSummaryCreate(
    input: CreateSummaryReqBody
  ): Promise<ValidationResult> {
    // 1단계: 기본 입력값 검증 (길이, 필수값 등)
    const basicValidation = validateSummaryInput(input);
    if (!basicValidation.isValid) {
      return {
        isValid: false,
        code: 'VALIDATION_ERROR',
        message: '입력값이 올바르지 않습니다.',
        details: basicValidation.message
      };
    }

    // 2단계: 보안 검증 (프롬프트 인젝션 감지)
    const securityCheck = await securityService.checkPromptInjection(
      input.userSummary,
      input.criticalWeakness,
      input.criticalOpposite
    );

    if (!securityCheck.isSafe) {
      // 서버 로그에만 자세한 이유 기록 (보안상 클라이언트에는 노출 안 함)
      console.warn('[보안] 프롬프트 인젝션 감지:', {
        reason: securityCheck.reason,
        userSummary: input.userSummary.substring(0, 100) + '...'
      });

      return {
        isValid: false,
        code: 'PROMPT_INJECTION_DETECTED',
        message: '입력 내용이 정책에 위배됩니다. 일반적인 요약 내용으로 작성해주세요.'
      };
    }

    // 모든 검증 통과
    return {
      isValid: true,
      message: '검증 성공'
    };
  }
}

export default new ValidationService();

