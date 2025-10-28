# Models (모델)

## 역할
데이터베이스와 직접 통신하는 계층
- 데이터 조회, 생성, 수정, 삭제 (CRUD)
- SQL 쿼리 실행

## 주의사항
- **오직 DB 작업만** 수행
- 비즈니스 로직은 작성하지 않음 (Controller에서 처리)

---

## 예시: user.model.ts

```typescript
import pool from '../config/database';

export interface User {
  id: number;
  name: string;
  email: string;
}

class UserModel {
  // 모든 사용자 조회
  async findAll(): Promise<User[]> {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query('SELECT * FROM users');
      return rows;
    } finally {
      if (conn) conn.release();
    }
  }

  // ID로 사용자 조회
  async findById(id: number): Promise<User | null> {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0] || null;
    } finally {
      if (conn) conn.release();
    }
  }

  // 사용자 생성
  async create(name: string, email: string): Promise<User> {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        [name, email]
      );
      return {
        id: Number(result.insertId),
        name,
        email
      };
    } finally {
      if (conn) conn.release();
    }
  }

  // 사용자 수정
  async update(id: number, name: string, email: string): Promise<boolean> {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        'UPDATE users SET name = ?, email = ? WHERE id = ?',
        [name, email, id]
      );
      return result.affectedRows > 0;
    } finally {
      if (conn) conn.release();
    }
  }

  // 사용자 삭제
  async delete(id: number): Promise<boolean> {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } finally {
      if (conn) conn.release();
    }
  }
}

export default new UserModel();
```

## 사용법

```typescript
// controllers/user.controller.ts에서 사용
import userModel from '../models/user.model';

const users = await userModel.findAll();
const user = await userModel.findById(1);
const newUser = await userModel.create('홍길동', 'hong@example.com');
```
