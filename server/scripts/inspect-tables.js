// scripts/inspect-tables.js — 检查现有表的数据量
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  prepare: false,
  ssl: { rejectUnauthorized: false }
});

try {
  for (const t of ['diaries', 'notes', 'store']) {
    const { rows } = await pool.query(`SELECT count(*)::int AS cnt FROM ${t}`);
    console.log(`表 ${t}: ${rows[0].cnt} 条数据`);
    if (rows[0].cnt > 0) {
      const sample = await pool.query(`SELECT * FROM ${t} LIMIT 2`);
      console.log('  样本：', JSON.stringify(sample.rows, null, 2));
    }
  }
} catch (e) {
  console.error('✗', e.message);
} finally {
  await pool.end();
}
