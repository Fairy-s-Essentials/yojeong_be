# Config (설정)

## 역할
데이터베이스 연결, 환경 변수 등 애플리케이션의 설정을 관리하는 폴더

## 언제 사용하나?
- 데이터베이스 연결 설정
- 외부 API 설정 (AWS, Firebase 등)
- 앱 전역 설정값

---

## 예시: database.ts

```typescript
import mariadb from 'mariadb';

// 연결 풀 생성
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'yojeong_db',
  connectionLimit: 10
});

// 연결 테스트 함수
export const testConnection = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  } finally {
    if (conn) conn.release();
  }
};

export default pool;
```

## 사용법

```typescript
// models/user.model.ts에서 사용
import pool from '../config/database';

const conn = await pool.getConnection();
const rows = await conn.query('SELECT * FROM users');
```
