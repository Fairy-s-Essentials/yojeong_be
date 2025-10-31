import express from 'express';
import type { Request, Response } from 'express';
import { pool } from './config/db';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript + Express!');
});

// db 연결 임시 테스트 코드
app.get('/test', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT NOW() AS now');
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error('DB 연결 실패:', err);
    res.status(500).json({ message: 'DB 연결 실패', error: (err as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
