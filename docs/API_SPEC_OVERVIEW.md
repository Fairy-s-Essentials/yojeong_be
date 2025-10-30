# API 명세서 - 요약 학습 서비스

## 개요
이 문서는 요약 학습 서비스의 백엔드 API 명세를 정의합니다.

## 기술 스택 가정
- Node.js + Express (또는 NestJS)
- MySQL
- JWT 인증
- TypeScript

## 공통 사항

### Base URL
```
http://localhost:3000
```

### 인증 방식
- JWT 기반 인증
- Access Token: 1시간 유효
- Refresh Token: 14일 유효
- Header: `Authorization: Bearer {token}`

### 공통 응답 형식

#### 성공 응답
```typescript
{
  success: true,
  data: {
    // 응답 데이터
  }
}
```

#### 실패 응답
```typescript
{
  success: false,
  error: {
    code: string,        // 에러 코드 (대문자 스네이크 케이스)
    message: string,     // 사용자용 에러 메시지
    details?: object     // 유효성 검증 에러 시 상세 정보
  }
}
```

### 공통 에러 코드

#### 401 Unauthorized
- `UNAUTHORIZED`: 로그인이 필요합니다
- `TOKEN_EXPIRED`: 토큰이 만료되었습니다
- `INVALID_TOKEN`: 유효하지 않은 토큰입니다
- `INVALID_KAKAO_CODE`: 유효하지 않은 카카오 인가 코드입니다

#### 403 Forbidden
- `FORBIDDEN`: 권한이 없습니다

#### 404 Not Found
- `SUMMARY_NOT_FOUND`: 요약을 찾을 수 없습니다
- `USER_NOT_FOUND`: 사용자를 찾을 수 없습니다

#### 400 Bad Request
- `VALIDATION_ERROR`: 입력값이 올바르지 않습니다
- `INVALID_DIFFICULTY`: 난이도는 1, 2, 3 중 하나여야 합니다
- `TEXT_TOO_SHORT`: 원문이 너무 짧습니다
- `TEXT_TOO_LONG`: 원문이 너무 깁니다
- `SUMMARY_TOO_LONG`: 요약이 너무 깁니다

#### 500 Internal Server Error
- `INTERNAL_ERROR`: 서버 오류가 발생했습니다
- `AI_SERVICE_ERROR`: AI 분석 중 오류가 발생했습니다

### 데이터베이스 스키마 참고

#### users 테이블
```sql
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `kakao_id` varchar(255) NOT NULL,
  `nickname` varchar(100) NOT NULL,
  `profile_image` varchar(500) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `refresh_token` varchar(500) DEFAULT NULL,
  `token_expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kakao_id` (`kakao_id`)
);
```

#### summaries 테이블
```sql
CREATE TABLE `summaries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `original_text` text NOT NULL,
  `original_url` varchar(2048) DEFAULT NULL,
  `difficulty_level` tinyint(1) NOT NULL,
  `user_summary` text NOT NULL,
  `critical_weakness` text NOT NULL,
  `critical_opposite` text NOT NULL,
  `critical_application` text NOT NULL,
  `ai_summary` text NOT NULL,
  `similarity_score` int(11) NOT NULL,
  `ai_well_understood` text NOT NULL,
  `ai_missed_points` text NOT NULL,
  `ai_improvements` text NOT NULL,
  `learning_note` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

**중요**: AI 분석 결과 필드(`ai_well_understood`, `ai_missed_points`, `ai_improvements`)는 DB에 `||` 구분자로 저장되지만, API 응답에서는 배열로 변환해야 합니다.

## API 엔드포인트 목록

### 1. 인증 (Authentication)
- [상세 명세: API_SPEC_AUTH.md](API_SPEC_AUTH.md)
  - POST /auth/kakao/login - 카카오 로그인
  - POST /auth/refresh - 토큰 갱신
  - POST /auth/logout - 로그아웃

### 2. 사용자 (Users)
- [상세 명세: API_SPEC_USERS.md](API_SPEC_USERS.md)
  - GET /users/me - 내 정보 조회

### 3. 요약 (Summaries)
- [상세 명세: API_SPEC_SUMMARIES.md](API_SPEC_SUMMARIES.md)
  - POST /summaries - 새 글 요약 생성
  - GET /summaries/:id - 요약 상세 조회
  - GET /summaries - 요약 목록 조회
  - PATCH /summaries/:id/learning-note - 배운점 추가/수정
  - DELETE /summaries/:id - 요약 삭제

### 4. 통계 (Statistics)
- [상세 명세: API_SPEC_STATISTICS.md](API_SPEC_STATISTICS.md)
  - GET /statistics/main - 메인 페이지 통계
  - GET /statistics/history - 학습 히스토리 통계
  - GET /statistics/accuracy-trend - 정확도 추이
  - GET /statistics/calendar - 학습 달력

## 개발 우선순위

### Phase 1 (필수)
1. 인증 API (로그인, 토큰 갱신)
2. 요약 생성 API (AI 연동 포함)
3. 요약 조회 API

### Phase 2 (중요)
4. 메인 통계 API
5. 요약 목록 API
6. 배운점 수정 API

### Phase 3 (부가)
7. 학습 히스토리 통계 API
8. 정확도 추이 API
9. 학습 달력 API

## 주의사항

### AI 서비스 연동
- POST /summaries 에서 AI 분석이 필요합니다
- 동기 처리 방식 (10~30초 소요 예상)
- AI 서비스 에러 시 적절한 에러 응답 반환
- 타임아웃 설정 필요 (최대 60초)

### 성능 고려사항
- 통계 API는 복잡한 계산이 필요하므로 쿼리 최적화 필수
- 인덱스 활용: `user_id`, `created_at`, `difficulty_level`
- 소프트 삭제된 데이터는 모든 조회에서 제외 (`is_deleted = 0`)

### 보안
- 모든 인증 필요 API는 JWT 검증 미들웨어 적용
- 사용자는 자신의 데이터만 조회/수정/삭제 가능
- SQL Injection 방지 (Prepared Statement 사용)
- XSS 방지 (입력값 검증 및 이스케이프)

### 유효성 검증
- 원문: 1,000~5,000자
- 난이도: 1, 2, 3만 허용
- 난이도별 요약 글자 수:
  - 1단계: 최대 300자
  - 2단계: 최대 450자
  - 3단계: 최대 600자
- 배운점: 최대 500자
- URL: 최대 2,048자

## TypeScript 타입 정의

각 API 명세 문서에 포함되어 있습니다.
