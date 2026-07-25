// scripts/init-db.js — 执行 schema.sql 建表
// 安全策略：若旧 diaries 表结构不兼容（无 tags 列），自动重命名为 diaries_legacy_backup
import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, '..', 'src', 'db', 'schema.sql');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  prepare: false,
  ssl: { rejectUnauthorized: false }
});

async function hasColumn(table, column) {
  const { rows } = await pool.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = $1 AND column_name = $2
  `, [table, column]);
  return rows.length > 0;
}

async function tableExists(table) {
  const { rows } = await pool.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_name = $1
  `, [table]);
  return rows.length > 0;
}

try {
  // 1. 检查旧表是否结构不兼容
  if (await tableExists('diaries')) {
    const hasTags = await hasColumn('diaries', 'tags');
    if (!hasTags) {
      const backupName = 'diaries_legacy_backup';
      // 若备份名已存在，加时间戳后缀
      let finalBackup = backupName;
      if (await tableExists(finalBackup)) {
        finalBackup = `${backupName}_${Date.now()}`;
      }
      console.log(`⚠ 现有 diaries 表结构不兼容（无 tags 列），重命名为 ${finalBackup} 备份`);
      await pool.query(`ALTER TABLE diaries RENAME TO ${finalBackup}`);
      console.log('✓ 旧表已备份');
    } else {
      console.log('ℹ diaries 表结构兼容，跳过重建');
      process.exit(0);
    }
  }

  // 2. 执行新 schema
  const sql = readFileSync(schemaPath, 'utf8');
  console.log('→ 执行 schema.sql ...');
  await pool.query(sql);
  console.log('✓ 表结构创建成功');

  // 3. 验证
  const { rows: cols } = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'diaries' ORDER BY ordinal_position
  `);
  console.log('\n新表结构：');
  cols.forEach(c => console.log(`  ${c.column_name.padEnd(15)} ${c.data_type}`));

  const { rows: idx } = await pool.query(`
    SELECT indexname FROM pg_indexes WHERE tablename = 'diaries'
  `);
  console.log('\n索引：' + idx.map(r => r.indexname).join(', '));
} catch (e) {
  console.error('✗ 建表失败:', e.message);
  console.error(e.stack);
  process.exit(1);
} finally {
  await pool.end();
}
