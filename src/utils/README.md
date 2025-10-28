# Utils (유틸리티)

## 역할
여러 곳에서 재사용되는 공통 함수들
- 응답 포맷 통일
- 날짜 변환
- 암호화/복호화
- 검증 헬퍼
- 기타 헬퍼 함수

---

## 예시 1: response.util.ts (응답 포맷)

```typescript
import { Response } from 'express';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * 성공 응답
 */
export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = '요청이 성공했습니다',
  statusCode: number = 200
) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data
  };

  return res.status(statusCode).json(response);
};

/**
 * 에러 응답
 */
export const errorResponse = (
  res: Response,
  message: string = '요청이 실패했습니다',
  statusCode: number = 400
) => {
  const response: ApiResponse<null> = {
    success: false,
    message,
    error: message
  };

  return res.status(statusCode).json(response);
};
```

### 사용 예시

```typescript
// Controller에서 사용
import { successResponse, errorResponse } from '../utils/response.util';

// 성공
return successResponse(res, users, '사용자 목록 조회 성공');

// 결과:
{
  "success": true,
  "message": "사용자 목록 조회 성공",
  "data": [...]
}

// 에러
return errorResponse(res, '사용자를 찾을 수 없습니다', 404);

// 결과:
{
  "success": false,
  "message": "사용자를 찾을 수 없습니다",
  "error": "사용자를 찾을 수 없습니다"
}
```

---

## 예시 2: validator.util.ts (검증)

```typescript
/**
 * 이메일 형식 검증
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 전화번호 형식 검증 (010-1234-5678)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\d{3}-\d{4}-\d{4}$/;
  return phoneRegex.test(phone);
};

/**
 * 비밀번호 강도 검증 (8자 이상, 영문+숫자)
 */
export const isStrongPassword = (password: string): boolean => {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return password.length >= 8 && hasLetter && hasNumber;
};
```

---

## 예시 3: date.util.ts (날짜)

```typescript
/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 날짜를 YYYY-MM-DD HH:MM:SS 형식으로 변환
 */
export const formatDateTime = (date: Date): string => {
  const dateStr = formatDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
};

/**
 * 몇 일 전인지 계산
 */
export const getDaysAgo = (date: Date): number => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};
```

---

## 예시 4: crypto.util.ts (암호화)

```typescript
import crypto from 'crypto';

/**
 * 비밀번호 해시화 (SHA256)
 */
export const hashPassword = (password: string): string => {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
};

/**
 * 랜덤 토큰 생성
 */
export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};
```

---

## 예시 5: string.util.ts (문자열)

```typescript
/**
 * 문자열 자르기 (말줄임표 추가)
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

/**
 * 카멜케이스를 스네이크케이스로 변환
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * 스네이크케이스를 카멜케이스로 변환
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};
```

---

## 사용 예시

```typescript
// Controller에서 사용
import { isValidEmail } from '../utils/validator.util';
import { formatDateTime } from '../utils/date.util';
import { hashPassword } from '../utils/crypto.util';

// 이메일 검증
if (!isValidEmail(email)) {
  return errorResponse(res, '유효하지 않은 이메일', 400);
}

// 비밀번호 해시화
const hashedPassword = hashPassword(password);

// 날짜 포맷
const createdAt = formatDateTime(new Date());
```

---

## Utils 작성 팁

1. **순수 함수로 작성**: 외부 상태를 변경하지 않음
2. **재사용 가능하게**: 특정 도메인에 종속되지 않게
3. **테스트 용이하게**: 입력과 출력이 명확하게
4. **문서화**: 함수의 목적과 사용법을 주석으로
