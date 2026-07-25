// scripts/test-api.mjs — 端到端 API CRUD 验证
const BASE = 'http://localhost:3000/api';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log('  ✓', msg); }
  else { fail++; console.log('  ✗', msg); }
}

async function req(method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await r.json().catch(() => ({}));
  return { status: r.status, json };
}

console.log('\n========== API CRUD 验证 ==========\n');

// 1. 健康
const h = await req('GET', '/health');
assert(h.json.code === 0 && h.json.data.db === 'connected', '健康检查 + 数据库已连接');

// 2. 清空旧测试数据
const before = await req('GET', '/diaries');
if (before.json.data && before.json.data.length) {
  for (const d of before.json.data) {
    if (d.content && d.content.startsWith('测试')) await req('DELETE', `/diaries/${d.id}`);
  }
}

// 3. 新建
const c = await req('POST', '/diaries', {
  content: '测试 Supabase 连接 - 第一篇',
  mood: '☀️',
  tags: ['测试', '连接'],
  date: '2026-07-25'
});
assert(c.status === 201 && c.json.data.id, 'POST 新建日记');
const id = c.json.data.id;

// 4. 获取详情
const g = await req('GET', `/diaries/${id}`);
assert(g.json.data && g.json.data.content.includes('第一篇'), 'GET 单条详情');
assert(Array.isArray(g.json.data.tags) && g.json.data.tags.length === 2, 'tags 数组正确返回');

// 5. 列表
const l = await req('GET', '/diaries');
assert(l.json.data.some(d => d.id === id), 'GET 列表含新日记');

// 6. 更新
const u = await req('PUT', `/diaries/${id}`, { content: '更新后的内容', mood: '🌧️' });
assert(u.json.data && u.json.data.content === '更新后的内容', 'PUT 更新正文');
assert(u.json.data.mood === '🌧️', 'PUT 更新心情');

// 7. 搜索
const s = await req('GET', '/diaries?keyword=更新后');
assert(s.json.data.some(d => d.id === id), 'GET 关键词搜索');

// 8. 月份过滤
const m = await req('GET', '/diaries?month=2026-07');
assert(m.json.data.some(d => d.id === id), 'GET 月份过滤');

// 9. 归档
const a = await req('GET', '/diaries/archive/list');
assert(a.json.data.some(it => it.month === '2026-07' && it.count >= 1), 'GET 归档列表');

// 10. 删除
const d = await req('DELETE', `/diaries/${id}`);
assert(d.json.code === 0, 'DELETE 删除');
const check = await req('GET', `/diaries/${id}`);
assert(check.status === 404, '删除后查询返回 404');

// 11. 删除不存在
const dn = await req('DELETE', '/diaries/not-exist-id');
assert(dn.status === 404, '删除不存在返回 404');

// 12. 更新不存在
const un = await req('PUT', '/diaries/not-exist-id', { content: 'x' });
assert(un.status === 404, '更新不存在返回 404');

console.log('\n==========================================');
console.log(`通过：${pass}  失败：${fail}`);
process.exit(fail === 0 ? 0 : 1);
