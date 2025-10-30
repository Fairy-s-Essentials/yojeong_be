# API 명세 - 인증 (Authentication)

## 1. 카카오 로그인

### Endpoint
```
POST /auth/kakao/login
```

### 설명
카카오 OAuth 인가 코드를 받아 사용자 인증을 처리하고 JWT 토큰을 발급합니다.

### Request

#### Headers
```
Content-Type: application/json
```

#### Body
```typescript
{
  code: string;  // 카카오 OAuth 인가 코드
}
```

#### 예시
```json
{
  "code": "abcd1234efgh5678"
}
```

### Response

#### 성공 (200 OK)
```typescript
{
  success: true,
  data: {
    accessToken: string,   // JWT Access Token (1시간 유효)
    refreshToken: string,  // JWT Refresh Token (14일 유효)
    user: {
      id: number,
      kakaoId: string,
      nickname: string,
      profileImage: string | null,
      email: string | null,
      createdAt: string  // ISO 8601 형식
    }
  }
}
```

#### 예시
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "kakaoId": "1234567890",
      "nickname": "홍길동",
      "profileImage": "https://k.kakaocdn.net/...",
      "email": "hong@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### 실패 (401 Unauthorized)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_KAKAO_CODE",
    "message": "유효하지 않은 카카오 인가 코드입니다"
  }
}
```

### 구현 로직

1. 카카오 인가 코드로 카카오 API 호출하여 사용자 정보 획득
2. `kakao_id`로 기존 사용자 조회
3. 신규 사용자인 경우:
   - `users` 테이블에 INSERT
   - 프로필 정보 저장
4. 기존 사용자인 경우:
   - 프로필 정보 업데이트 (nickname, profile_image, email)
5. JWT Access Token 생성 (만료: 1시간)
6. JWT Refresh Token 생성 (만료: 14일)
7. Refresh Token을 DB에 저장 (`users.refresh_token`, `users.token_expires_at`)
8. 응답 반환

### 주의사항
- 카카오 API 호출 실패 시 적절한 에러 처리
- 이미 삭제된 사용자(`is_deleted = 1`)의 경우 재활성화 처리
- 토큰 만료 시간은 UTC 기준으로 저장

---

## 2. 토큰 갱신

### Endpoint
```
POST /auth/refresh
```

### 설명
만료된 Access Token을 Refresh Token으로 갱신합니다.

### Request

#### Headers
```
Authorization: Bearer {refreshToken}
Content-Type: application/json
```

### Response

#### 성공 (200 OK)
```typescript
{
  success: true,
  data: {
    accessToken: string,   // 새로운 Access Token
    refreshToken: string   // 새로운 Refresh Token
  }
}
```

#### 예시
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 실패 (401 Unauthorized)

**토큰 만료**
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "리프레시 토큰이 만료되었습니다. 다시 로그인해주세요"
  }
}
```

**유효하지 않은 토큰**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "유효하지 않은 토큰입니다"
  }
}
```

### 구현 로직

1. Authorization 헤더에서 Refresh Token 추출
2. JWT 검증 (서명, 만료 시간)
3. 토큰에서 사용자 ID 추출
4. DB에서 사용자 조회 및 저장된 Refresh Token과 비교
5. 토큰이 유효하면:
   - 새로운 Access Token 생성
   - 새로운 Refresh Token 생성 (선택적)
   - DB 업데이트
6. 응답 반환

### 주의사항
- Refresh Token은 DB에 저장된 값과 일치해야 함
- 탈취된 토큰 사용을 방지하기 위해 Refresh Token도 갱신하는 것을 권장
- 삭제된 사용자는 토큰 갱신 불가

---

## 3. 로그아웃

### Endpoint
```
POST /auth/logout
```

### 설명
현재 로그인된 사용자를 로그아웃 처리합니다.

### Request

#### Headers
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Response

#### 성공 (200 OK)
```typescript
{
  success: true,
  data: {
    message: string
  }
}
```

#### 예시
```json
{
  "success": true,
  "data": {
    "message": "로그아웃되었습니다"
  }
}
```

#### 실패 (401 Unauthorized)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "로그인이 필요합니다"
  }
}
```

### 구현 로직

1. Authorization 헤더에서 Access Token 추출 및 검증
2. 토큰에서 사용자 ID 추출
3. DB에서 해당 사용자의 Refresh Token 삭제
   ```sql
   UPDATE users 
   SET refresh_token = NULL, token_expires_at = NULL
   WHERE id = ?
   ```
4. 응답 반환

### 주의사항
- Access Token은 stateless이므로 만료 전까지는 여전히 유효함
- 클라이언트에서 토큰을 삭제하도록 안내 필요
- Refresh Token을 무효화하여 재발급 방지

---

## TypeScript 타입 정의

```typescript
// Request Types
interface KakaoLoginRequest {
  code: string;
}

// Response Types
interface User {
  id: number;
  kakaoId: string;
  nickname: string;
  profileImage: string | null;
  email: string | null;
  createdAt: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

interface LogoutResponse {
  message: string;
}

// API Response Wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

---

## 테스트 케이스

### 1. 카카오 로그인
- [ ] 유효한 인가 코드로 로그인 성공
- [ ] 신규 사용자 등록 및 토큰 발급
- [ ] 기존 사용자 로그인 및 프로필 업데이트
- [ ] 잘못된 인가 코드로 실패
- [ ] 카카오 API 에러 처리

### 2. 토큰 갱신
- [ ] 유효한 Refresh Token으로 갱신 성공
- [ ] 만료된 Refresh Token으로 실패
- [ ] 잘못된 형식의 토큰으로 실패
- [ ] DB에 없는 토큰으로 실패

### 3. 로그아웃
- [ ] 정상 로그아웃 처리
- [ ] Refresh Token 무효화 확인
- [ ] 로그아웃 후 Refresh Token 사용 불가 확인
