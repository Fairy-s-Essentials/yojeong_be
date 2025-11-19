import {
  LogicQuality,
  ExpressionAccuracy,
  CriticalThinking
} from '../types/summary';

/**
 * 논리 품질 평가 점수 테이블
 */
export const LOGIC_QUALITY_SCORES: Record<
  LogicQuality,
  { percentage: number; description: string }
> = {
  EXCELLENT: {
    percentage: 1.0, // 100%
    description:
      '논리 흐름이 완벽하고 인과관계가 명확함. 주장-근거-결론 구조가 탁월함'
  },
  VERY_GOOD: {
    percentage: 0.85, // 85%
    description:
      '논리 흐름이 명확하고 구조가 잘 잡혀있으나 사소한 비약이 있음'
  },
  GOOD: {
    percentage: 0.7, // 70%
    description:
      '전체적으로 논리적이나 일부 연결이 약하거나 구조가 다소 느슨함'
  },
  MODERATE: {
    percentage: 0.5, // 50%
    description:
      '기본적인 논리는 있으나 흐름이 자연스럽지 않거나 비약이 있음'
  },
  WEAK: {
    percentage: 0.3, // 30%
    description: '논리가 약하고 단편적 나열 위주. 인과관계가 불분명함'
  },
  POOR: {
    percentage: 0.0, // 0%
    description: '논리 없음. 무작위 나열이거나 앞뒤가 맞지 않음'
  }
};

/**
 * 표현 정확성 평가 점수 테이블
 */
export const EXPRESSION_ACCURACY_SCORES: Record<
  ExpressionAccuracy,
  { percentage: number; description: string }
> = {
  PERFECT: {
    percentage: 1.0, // 100%
    description: '완벽하게 객관적이고 명확함. 사실 왜곡 없고 전문적인 표현'
  },
  EXCELLENT: {
    percentage: 0.85, // 85%
    description:
      '매우 정확하고 객관적. 사소한 모호함만 있을 뿐 전체적으로 우수함'
  },
  GOOD: {
    percentage: 0.7, // 70%
    description:
      '대체로 정확하나 일부 표현이 모호하거나 약간의 주관이 섞임'
  },
  MODERATE: {
    percentage: 0.5, // 50%
    description: '중간 수준. 일부 과장 표현이나 감정어가 포함되어 있음'
  },
  WEAK: {
    percentage: 0.3, // 30%
    description: '부정확한 표현 다수. 과장, 왜곡, 감정적 표현이 많음'
  },
  POOR: {
    percentage: 0.0, // 0%
    description: '심각한 사실 왜곡이나 완전히 부적절한 표현'
  }
};

/**
 * 비판적 사고 반영도 평가 점수 테이블
 */
export const CRITICAL_THINKING_SCORES: Record<
  CriticalThinking,
  { percentage: number; description: string }
> = {
  EXCELLENT: {
    percentage: 1.0, // 100%
    description:
      '비판적 읽기 내용을 논리적으로 잘 통합하여 균형잡힌 요약 작성'
  },
  GOOD: {
    percentage: 0.7, // 70%
    description: '비판적 읽기를 일부 반영했으나 통합이 완벽하지 않음'
  },
  WEAK: {
    percentage: 0.3, // 30%
    description: '비판적 읽기를 언급했으나 피상적이거나 맥락에 맞지 않음'
  },
  NONE: {
    percentage: 0.0, // 0%
    description: '비판적 읽기 내용을 전혀 반영하지 않음'
  }
};

/**
 * 평가 항목별 배점 (총 100점)
 */
export const SCORE_WEIGHTS = {
  // 비판적 읽기 없을 때
  WITHOUT_CRITICAL: {
    COVERAGE: 45, // 핵심 포인트 포함도
    LOGIC: 35, // 논리 흐름
    EXPRESSION: 20 // 표현 정확성
  },
  // 비판적 읽기 있을 때
  WITH_CRITICAL: {
    COVERAGE: 40, // 핵심 포인트 포함도
    LOGIC: 30, // 논리 흐름
    EXPRESSION: 20, // 표현 정확성
    CRITICAL: 10 // 비판적 사고 반영도
  }
};

/**
 * 상세함 감점 설정
 */
export const DETAIL_PENALTY = {
  // 사용자 요약이 AI 요약 대비 이 비율보다 짧으면 감점
  MIN_LENGTH_RATIO: 0.3, // 30%
  // 길이 부족 시 감점
  LENGTH_PENALTY: 10,
  // 핵심 포인트 커버리지가 낮을 때 추가 감점
  LOW_COVERAGE_THRESHOLD: 0.5, // 50% 미만
  LOW_COVERAGE_PENALTY: 5
};

