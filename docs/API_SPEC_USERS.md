# API 명세 - 사용자 (Users)

## 1. 내 정보 조회

### Endpoint
```
GET /users/me
```

### 설명
현재 로그인된 사용자의 정보를 조회합니다.

### Request

#### Headers
```
Authorization: Bearer {accessToken}
```

### Response

#### 성공 (200 OK)
```typescript
{
  success: true,
  data: {
    id: number,
    kakaoId: string,
    nickname: string,
    profileImage: string | null,
    email: string | null,
    createdAt: string  // ISO 8601 형식
  }
}
```

#### 예시
```json
{
  "success": true,
  "data": {
    "id": 1,
    "kakaoId": "1234567890",
    "nickname": "홍길동",
    "profileImage": "https://k.kakaocdn.net/dn/profile.jpg",
    "email": "hong@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 실패 (401 Unauthorized)

**인증 필요**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "로그인이 필요합니다"
  }
}
```

**토큰 만료**
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "토큰이 만료되었습니다"
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

#### 실패 (404 Not Found)
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "사용자를 찾을 수 없습니다"
  }
}
```

### 구현 로직

1. Authorization 헤더에서 Access Token 추출 및 검증
2. 토큰에서 사용자 ID 추출
3. DB에서 사용자 조회
   ```sql
   SELECT id, kakao_id, nickname, profile_image, email, created_at
   FROM users
   WHERE id = ? AND is_deleted = 0
   ```
4. 사용자가 존재하면 정보 반환
5. 사용자가 없거나 삭제된 경우 404 에러

### 주의사항
- 민감한 정보(refresh_token, token_expires_at 등)는 반환하지 않음
- 삭제된 사용자(`is_deleted = 1`)는 조회 불가
- ISO 8601 형식으로 날짜 반환

---

## TypeScript 타입 정의

```typescript
// Response Types
interface UserInfo {
  id: number;
  kakaoId: string;
  nickname: string;
  profileImage: string | null;
  email: string | null;
  createdAt: string;
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

type GetUserInfoResponse = ApiResponse<UserInfo>;
```

---

## 테스트 케이스

### 내 정보 조회
- [ ] 유효한 토큰으로 사용자 정보 조회 성공
- [ ] 토큰 없이 요청 시 401 에러
- [ ] 만료된 토큰으로 요청 시 401 에러
- [ ] 잘못된 형식의 토큰으로 요청 시 401 에러
- [ ] 존재하지 않는 사용자 토큰으로 요청 시 404 에러
- [ ] 삭제된 사용자 토큰으로 요청 시 404 에러
- [ ] 응답에 민감한 정보가 포함되지 않는지 확인

---

## 미들웨어 구현 참고

JWT 인증 미들웨어 예시:

```typescript
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  iat: number;
  exp: number;
}

export const authMiddleware = async (req, res, next) => {
  try {
    // 1. Authorization 헤더 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '로그인이 필요합니다'
        }
      });
    }

    // 2. 토큰 추출
    const token = authHeader.substring(7);

    // 3. 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    // 4. 사용자 정보를 요청 객체에 추가
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: '토큰이 만료되었습니다'
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '유효하지 않은 토큰입니다'
      }
    });
  }
};
```

이 미들웨어는 모든 인증이 필요한 엔드포인트에 적용됩니다.
