# Services (서비스) - ⚠️ 선택사항

## ⚠️ 이 폴더는 선택사항입니다!

백엔드 초보라면 **Service 계층 없이** Controller → Model로 시작하세요.
프로젝트가 복잡해지면 그때 추가해도 됩니다.

---

## 언제 Service를 사용하나?

### Service가 필요 없는 경우 (간단)
```typescript
// Controller에서 바로 Model 호출
class UserController {
  async getUser(req: Request, res: Response) {
    const user = await userModel.findById(id);
    return res.json(user);
  }
}
```

### Service가 필요한 경우 (복잡)
- 여러 Model을 조합해야 할 때
- 복잡한 비즈니스 로직이 있을 때
- 트랜잭션이 필요할 때

---

## 역할
Controller와 Model 사이의 **비즈니스 로직 처리 계층**
- 여러 Model 조합
- 복잡한 계산/변환
- 트랜잭션 관리

## 흐름
```
기본:    Controller → Model → DB
추가 시: Controller → Service → Model → DB
```

---

## 예시 1: 여러 Model 조합

**user.service.ts**
```typescript
import userModel from '../models/user.model';
import postModel from '../models/post.model';
import commentModel from '../models/comment.model';

class UserService {
  /**
   * 사용자 정보 + 게시글 + 댓글 통합 조회
   */
  async getUserWithActivity(userId: number) {
    // 여러 Model에서 데이터 가져오기
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    const posts = await postModel.findByUserId(userId);
    const comments = await commentModel.findByUserId(userId);

    // 비즈니스 로직: 통계 계산
    return {
      ...user,
      posts,
      comments,
      stats: {
        totalPosts: posts.length,
        totalComments: comments.length,
        totalActivity: posts.length + comments.length
      }
    };
  }

  /**
   * 사용자 생성 + 초기 설정
   */
  async createUserWithDefaults(name: string, email: string) {
    // 1. 사용자 생성
    const user = await userModel.create(name, email);

    // 2. 기본 프로필 생성
    await profileModel.create(user.id, {
      bio: '안녕하세요!',
      avatar: 'default.png'
    });

    // 3. 환영 메시지 발송
    await notificationModel.create(user.id, '가입을 환영합니다!');

    return user;
  }
}

export default new UserService();
```

---

## 예시 2: 트랜잭션 처리

**order.service.ts**
```typescript
import pool from '../config/database';
import orderModel from '../models/order.model';
import productModel from '../models/product.model';
import paymentModel from '../models/payment.model';

class OrderService {
  /**
   * 주문 생성 (트랜잭션)
   * - 주문 생성
   * - 재고 감소
   * - 결제 기록
   */
  async createOrder(userId: number, productId: number, quantity: number) {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction(); // 트랜잭션 시작

      // 1. 재고 확인
      const product = await productModel.findById(productId, conn);
      if (product.stock < quantity) {
        throw new Error('재고가 부족합니다');
      }

      // 2. 주문 생성
      const order = await orderModel.create(userId, productId, quantity, conn);

      // 3. 재고 감소
      await productModel.decreaseStock(productId, quantity, conn);

      // 4. 결제 기록
      await paymentModel.create(order.id, product.price * quantity, conn);

      await conn.commit(); // 트랜잭션 커밋
      return order;
    } catch (error) {
      if (conn) await conn.rollback(); // 에러 시 롤백
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}

export default new OrderService();
```

---

## 예시 3: 복잡한 비즈니스 로직

**auth.service.ts**
```typescript
import userModel from '../models/user.model';
import { hashPassword } from '../utils/crypto.util';
import { generateToken } from '../utils/crypto.util';

class AuthService {
  /**
   * 회원가입 로직
   */
  async register(name: string, email: string, password: string) {
    // 1. 이메일 중복 확인
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      throw new Error('이미 사용 중인 이메일입니다');
    }

    // 2. 비밀번호 암호화
    const hashedPassword = hashPassword(password);

    // 3. 사용자 생성
    const user = await userModel.create(name, email, hashedPassword);

    // 4. 인증 토큰 생성
    const token = generateToken();
    await tokenModel.create(user.id, token);

    // 5. 환영 이메일 발송 (비동기)
    this.sendWelcomeEmail(email).catch(console.error);

    return { user, token };
  }

  /**
   * 로그인 로직
   */
  async login(email: string, password: string) {
    // 1. 사용자 찾기
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error('이메일 또는 비밀번호가 잘못되었습니다');
    }

    // 2. 비밀번호 확인
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      throw new Error('이메일 또는 비밀번호가 잘못되었습니다');
    }

    // 3. 토큰 생성
    const token = generateToken();
    await tokenModel.create(user.id, token);

    return { user, token };
  }

  private async sendWelcomeEmail(email: string) {
    // 이메일 발송 로직
  }
}

export default new AuthService();
```

---

## Controller에서 Service 사용

```typescript
import { Request, Response } from 'express';
import userService from '../services/user.service';

class UserController {
  async getUserWithActivity(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Service 호출 (복잡한 로직은 Service에서 처리)
      const data = await userService.getUserWithActivity(Number(id));

      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
```

---

## Service vs Controller 역할 구분

### Controller의 역할
- HTTP 요청/응답 처리
- 입력값 검증
- 응답 형식 결정

### Service의 역할
- 비즈니스 로직 실행
- 여러 Model 조합
- 트랜잭션 관리
- 복잡한 계산/변환

---

## 언제 Service를 추가할까?

### 추가하지 않아도 되는 경우
- Controller에서 Model 하나만 호출
- 단순 CRUD 작업
- 복잡한 로직 없음

### 추가하는 것이 좋은 경우
- Controller 코드가 100줄 이상
- 여러 Model을 조합해야 함
- 같은 로직을 여러 Controller에서 사용
- 트랜잭션이 필요함

---

## 정리

**처음에는 Service 없이 시작하세요!**
```
Client → Routes → Controller → Model → DB
```

**나중에 복잡해지면 추가하세요!**
```
Client → Routes → Controller → Service → Model → DB
```
