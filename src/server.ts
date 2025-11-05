import express from "express";
import type { Request, Response } from "express";
import session from "express-session";
import cors from "cors";
import { pool } from "./config/db";
import RootRouter from "./routes/router";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, 
  })
);

// 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // production에서는 HTTPS 필수
      httpOnly: true, // XSS 공격 방지
      maxAge: 1000 * 60 * 60 * 24, // 1일
    },
  })
);

app.use(express.json());

app.use(RootRouter);

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
    res
      .status(500)
      .json({ message: 'DB 연결 실패', error: (err as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
