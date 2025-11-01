import mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  allowPublicKeyRetrieval: true, // Cloudtype 외부 접속용 옵션
  ssl: false // 외부 SSL 허용
});
