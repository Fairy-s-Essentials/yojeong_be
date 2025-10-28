# Routes (라우트)

## 역할
API 엔드포인트를 정의하고 URL과 Controller를 연결
- HTTP 메서드 정의 (GET, POST, PUT, DELETE)
- URL 경로 정의
- 미들웨어 적용

---

## 예시: user.routes.ts

```typescript
import { Router } from 'express';
import userController from '../controllers/user.controller';

const router = Router();

/**
 * User 관련 API 라우트
 * 기본 경로: /api/users
 */

// GET /api/users - 모든 사용자 조회
router.get('/', userController.getAllUsers);

// GET /api/users/:id - 특정 사용자 조회
router.get('/:id', userController.getUserById);

// POST /api/users - 사용자 생성
router.post('/', userController.createUser);

// PUT /api/users/:id - 사용자 수정
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - 사용자 삭제
router.delete('/:id', userController.deleteUser);

export default router;
```

---

## 미들웨어 적용 예시

```typescript
import authMiddleware from '../middlewares/auth.middleware';

// 인증이 필요한 라우트
router.get('/',
  authMiddleware.verifyToken,  // 먼저 토큰 검증
  userController.getAllUsers    // 그 다음 컨트롤러 실행
);

// 여러 미들웨어 적용
router.post('/',
  authMiddleware.verifyToken,
  authMiddleware.checkAdmin,
  userController.createUser
);
```

---

## 통합 라우트: index.ts

모든 라우트를 한 곳에서 관리

```typescript
import { Router } from 'express';
import userRoutes from './user.routes';
// import postRoutes from './post.routes';

const router = Router();

// 각 도메인별 라우트 등록
router.use('/users', userRoutes);     // /api/users
// router.use('/posts', postRoutes);  // /api/posts
// router.use('/auth', authRoutes);   // /api/auth

export default router;
```

---

## server.ts에서 사용

```typescript
import express from 'express';
import apiRoutes from './routes';

const app = express();

// 모든 API는 /api로 시작
app.use('/api', apiRoutes);

// 결과:
// /api/users        -> GET 모든 사용자
// /api/users/:id    -> GET 특정 사용자
// /api/users        -> POST 사용자 생성
```

---

## 라우트 작성 팁

1. **RESTful 설계**
   - GET: 조회
   - POST: 생성
   - PUT: 수정
   - DELETE: 삭제

2. **URL 경로 규칙**
   - 복수형 사용: `/users`, `/posts`
   - 명사 사용: `/users` (동사 X: `/getUsers`)
   - 계층 구조: `/users/:id/posts`

3. **미들웨어 순서**
   ```typescript
   router.post('/',
     인증확인,        // 1. 로그인 체크
     권한확인,        // 2. 권한 체크
     입력값검증,      // 3. 데이터 검증
     컨트롤러        // 4. 실제 로직 실행
   );
   ```
