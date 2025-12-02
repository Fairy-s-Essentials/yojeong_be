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
      return {
        isValid: false,
        code: 'PROMPT_INJECTION_DETECTED',
        message: '입력 내용에 보안 위협이 감지되었습니다.',
        details: securityCheck.reason
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

