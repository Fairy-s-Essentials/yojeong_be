# Middlewares (미들웨어)

## 역할
요청(Request)이 Controller에 도달하기 전에 실행되는 함수
- 인증/인가 체크
- 요청 데이터 검증
- 로깅
- 에러 처리

## 흐름
Request → **Middleware** → Controller

---

## 미들웨어 기본 형태

```typescript
(req: Request, res: Response, next: NextFunction) => {
  // 작업 수행
  next(); // 다음 미들웨어나 컨트롤러로 이동
}
```

---

## 예시 1: auth.middleware.ts (인증)

```typescript
import { Request, Response, NextFunction } from 'express';

class AuthMiddleware {
  // 토큰 검증
  verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(' ')[1]; // "Bearer {token}"

      if (!token) {
        return res.status(401).json({
          success: false,
          message: '인증 토큰이 필요합니다'
        });
      }

      // TODO: JWT 검증 로직
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // req.user = decoded;

      next(); // 검증 성공 → 다음 단계로
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다'
      });
    }
  }

  // 관리자 권한 체크
  checkAdmin(req: Request, res: Response, next: NextFunction) {
    // TODO: req.user의 role 확인
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: '관리자 권한이 필요합니다'
    //   });
    // }

    next();
  }
}

export default new AuthMiddleware();
```

---

## 예시 2: validation.middleware.ts (검증)

```typescript
import { Request, Response, NextFunction } from 'express';

export const validateUserInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      success: false,
      message: '이름은 문자열이어야 합니다'
    });
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      message: '이메일은 문자열이어야 합니다'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: '유효하지 않은 이메일 형식'
    });
  }

  next(); // 검증 통과
};
```

---

## 예시 3: logger.middleware.ts (로깅)

```typescript
import { Request, Response, NextFunction } from 'express';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};
```

---

## 예시 4: error.middleware.ts (에러 처리)

```typescript
import { Request, Response, NextFunction } from 'express';

// 전역 에러 핸들러
// server.ts의 가장 마지막에 등록
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Global Error:', err);

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || '서버 에러가 발생했습니다'
  });
};
```

---

## 사용법

### Route에서 적용

```typescript
import authMiddleware from '../middlewares/auth.middleware';
import { validateUserInput } from '../middlewares/validation.middleware';

// 단일 미들웨어
router.get('/', authMiddleware.verifyToken, userController.getAllUsers);

// 여러 미들웨어
router.post('/',
  authMiddleware.verifyToken,   // 1. 인증 확인
  validateUserInput,            // 2. 입력값 검증
  userController.createUser     // 3. 컨트롤러 실행
);
```

### 전역 적용 (server.ts)

```typescript
import { requestLogger } from './middlewares/logger.middleware';
import { errorHandler } from './middlewares/error.middleware';

// 모든 요청에 적용
app.use(requestLogger);

// 라우트 등록
app.use('/api', apiRoutes);

// 에러 핸들러는 가장 마지막에
app.use(errorHandler);
```

---

## 미들웨어 작성 팁

1. **next() 호출 필수**: 다음 단계로 넘어가려면 반드시 `next()` 호출
2. **응답하거나 next() 둘 중 하나**: `res.json()` 하면 `next()` 불필요
3. **순서 중요**: 미들웨어는 등록된 순서대로 실행
4. **에러는 throw 대신 response**: Controller에 도달하기 전에 응답
