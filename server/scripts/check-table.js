// scripts/check-table.js — 检查 diaries 表状态
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  prepare: false,
  ssl: { rejectUnauthorized: false }
});

try {
  const { rows: tables } = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
  `);
  console.log('现有表：', tables.map(r => r.table_name));

  const { rows: cols } = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'diaries'
    ORDER BY ordinal_position
  `);
  console.log('diaries 表列：', cols);
} catch (e) {
  console.error('✗', e.message);
} finally {
  await pool.end();
}
