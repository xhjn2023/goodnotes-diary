// src/config/database.js — Supabase PostgreSQL 连接池
import pg from 'pg';

const { Pool } = pg;

let pool = null;

/**
 * 创建并初始化 PostgreSQL 连接池
 * 针对 Supabase PGBouncer 池模式做了适配：
 * - prepare: false （PGBouncer transaction 模式不支持 prepared statements）
 * - 连接超时 / 空闲超时配置
 */
export async function connectDB() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('⚠ DATABASE_URL 未设置，跳过数据库连接');
    return null;
  }

  try {
    pool = new Pool({
      connectionString,
      // PGBouncer transaction 模式不支持 prepared statements
      prepare: false,
      // 连接池大小（Supabase 免费档最多 60 直连 / 池更宽松）
      max: 10,
      // 超时
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      // SSL：Supabase 远端强制 SSL
      ssl: { rejectUnauthorized: false }
    });

    // 验证连接
    const client = await pool.connect();
    const { rows } = await client.query('SELECT NOW() AS now, current_database() AS db');
    console.log(`✓ Supabase PostgreSQL connected — db="${rows[0].db}" time="${rows[0].now}"`);
    client.release();

    // 监听错误
    pool.on('error', (err) => {
      console.error('✗ 连接池错误:', err.message);
    });

    return pool;
  } catch (err) {
    console.error('✗ Supabase 连接失败:', err.message);
    console.log('  服务仍将启动（数据库相关接口将返回 503）');
    return null;
  }
}

// 获取连接池（已连接或未连接都返回当前实例）
export function getPool() {
  return pool;
}

// 执行查询（统一错误处理）
export async function query(text, params) {
  if (!pool) throw new Error('Database not connected');
  const start = Date.now();
  const res = await pool.query(text, params);
  const dur = Date.now() - start;
  if (dur > 200) {
    console.log(`[slow query ${dur}ms] ${text.split('\n').map(s => s.trim()).join(' ').slice(0, 120)}`);
  }
  return res;
}
