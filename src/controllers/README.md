# Controllers (컨트롤러)

## 역할
비즈니스 로직을 처리하는 계층
- 요청(Request) 데이터 검증
- Model을 호출하여 데이터 처리
- 응답(Response) 형식 결정

## 흐름
Route → **Controller** → Model → Controller → Response

---

## 예시: user.controller.ts

```typescript
import { Request, Response } from 'express';
import userModel from '../models/user.model';

class UserController {
  // GET /api/users - 모든 사용자 조회
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await userModel.findAll();

      return res.status(200).json({
        success: true,
        message: '사용자 목록 조회 성공',
        data: users
      });
    } catch (error) {
      console.error('getAllUsers error:', error);
      return res.status(500).json({
        success: false,
        message: '사용자 목록 조회 실패'
      });
    }
  }

  // GET /api/users/:id - 특정 사용자 조회
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 입력값 검증
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 사용자 ID'
        });
      }

      const user = await userModel.findById(Number(id));

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다'
        });
      }

      return res.status(200).json({
        success: true,
        message: '사용자 조회 성공',
        data: user
      });
    } catch (error) {
      console.error('getUserById error:', error);
      return res.status(500).json({
        success: false,
        message: '사용자 조회 실패'
      });
    }
  }

  // POST /api/users - 사용자 생성
  async createUser(req: Request, res: Response) {
    try {
      const { name, email } = req.body;

      // 입력값 검증
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: '이름과 이메일은 필수입니다'
        });
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 이메일 형식'
        });
      }

      const newUser = await userModel.create(name, email);

      return res.status(201).json({
        success: true,
        message: '사용자 생성 성공',
        data: newUser
      });
    } catch (error) {
      console.error('createUser error:', error);
      return res.status(500).json({
        success: false,
        message: '사용자 생성 실패'
      });
    }
  }

  // PUT /api/users/:id - 사용자 수정
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 사용자 ID'
        });
      }

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: '이름과 이메일은 필수입니다'
        });
      }

      const updated = await userModel.update(Number(id), name, email);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다'
        });
      }

      return res.status(200).json({
        success: true,
        message: '사용자 수정 성공'
      });
    } catch (error) {
      console.error('updateUser error:', error);
      return res.status(500).json({
        success: false,
        message: '사용자 수정 실패'
      });
    }
  }

  // DELETE /api/users/:id - 사용자 삭제
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 사용자 ID'
        });
      }

      const deleted = await userModel.delete(Number(id));

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다'
        });
      }

      return res.status(200).json({
        success: true,
        message: '사용자 삭제 성공'
      });
    } catch (error) {
      console.error('deleteUser error:', error);
      return res.status(500).json({
        success: false,
        message: '사용자 삭제 실패'
      });
    }
  }
}

export default new UserController();
```

## 주요 책임
1. **입력값 검증**: 요청 데이터가 올바른지 확인
2. **비즈니스 로직**: 데이터 처리 규칙 적용
3. **Model 호출**: 데이터베이스 작업 요청
4. **응답 형식**: 일관된 JSON 형식으로 응답
