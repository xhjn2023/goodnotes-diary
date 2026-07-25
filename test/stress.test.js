// test/stress.test.js — 数据层压力测试
// 用 Node 模拟 wx.storage，对 storage.js / date.js 做大规模与边界测试
// 运行：node test/stress.test.js

// ---------- mock wx ----------
const store = {};
global.wx = {
  getStorageSync(k) { return store[k]; },
  setStorageSync(k, v) { store[k] = v; },
  removeStorageSync(k) { delete store[k]; }
};

const assert = require('assert');
const storage = require('../miniprogram/utils/storage.js');
const dateUtil = require('../miniprogram/utils/date.js');

let pass = 0, fail = 0;
const results = [];
function test(name, fn) {
  try { fn(); pass++; results.push(`  ✓ ${name}`); }
  catch (e) { fail++; results.push(`  ✗ ${name}\n      ${e.message}`); }
}

function reset() { for (const k in store) delete store[k]; }

// ---------- date.js 单元测试 ----------
test('date.toISO 格式正确', () => {
  assert.strictEqual(dateUtil.toISO(new Date(2026, 6, 25)), '2026-07-25');
  assert.strictEqual(dateUtil.toISO(new Date(2026, 0, 1)), '2026-01-01');
});

test('date.today 返回今天', () => {
  const d = new Date();
  const expected = dateUtil.toISO(d);
  assert.strictEqual(dateUtil.today(), expected);
});

test('date.parse 解析各字段', () => {
  const p = dateUtil.parse('2026-07-25');
  assert.ok(p);
  assert.strictEqual(p.year, '2026');
  assert.strictEqual(p.month, '07');
  assert.strictEqual(p.day, '25');
  assert.strictEqual(p.monthEn, 'JUL');
});

test('date.parse 容错非法输入', () => {
  assert.strictEqual(dateUtil.parse(''), null);
  assert.strictEqual(dateUtil.parse(null), null);
  assert.strictEqual(dateUtil.parse('abc-de-fg'), null);          // 非数字
  assert.strictEqual(dateUtil.parse('2026-13-01'), null);          // 月越界
  assert.strictEqual(dateUtil.parse('2026-02-30'), null);          // 2月30日不存在
  // 非零填充的有效日期应被接受并规范化
  const p = dateUtil.parse('2026-7-5');
  assert.ok(p, '2026-7-5 是有效日期应解析成功');
  assert.strictEqual(p.month, '07');
  assert.strictEqual(p.day, '05');
});

test('date.toChinese 长格式', () => {
  assert.strictEqual(dateUtil.toChinese('2026-07-25'), '2026年7月25日 周六');
});

test('date.monthChinese 月份格式', () => {
  assert.strictEqual(dateUtil.monthChinese('2026-07'), '2026年7月');
  assert.strictEqual(dateUtil.monthChinese('2026-12'), '2026年12月');
});

// ---------- storage.js 基础测试 ----------
test('空库 getAll 返回空数组', () => {
  reset();
  assert.strictEqual(storage.getAll().length, 0);
  assert.strictEqual(storage.count(), 0);
});

test('create 新建并返回完整对象', () => {
  reset();
  const it = storage.create({ content: '你好', mood: '☀️', tags: ['生活'], date: '2026-07-25' });
  assert.ok(it.id, '应有 id');
  assert.strictEqual(it.content, '你好');
  assert.strictEqual(it.mood, '☀️');
  assert.deepStrictEqual(it.tags, ['生活']);
  assert.strictEqual(it.date, '2026-07-25');
  assert.ok(it.createdAt > 0);
});

test('getAll 默认倒序（日期 desc）', () => {
  reset();
  storage.create({ content: '早', date: '2026-07-01' });
  storage.create({ content: '晚', date: '2026-07-25' });
  storage.create({ content: '中', date: '2026-07-15' });
  const list = storage.getAll();
  assert.strictEqual(list[0].content, '晚');
  assert.strictEqual(list[1].content, '中');
  assert.strictEqual(list[2].content, '早');
});

test('update 更新字段且保留 id', () => {
  reset();
  const it = storage.create({ content: '旧', date: '2026-07-25' });
  const next = storage.update(it.id, { content: '新内容', mood: '🌧️' });
  assert.strictEqual(next.id, it.id);
  assert.strictEqual(next.content, '新内容');
  assert.strictEqual(next.mood, '🌧️');
  assert.ok(next.updatedAt >= it.createdAt);
});

test('update 不存在 id 返回 null', () => {
  reset();
  assert.strictEqual(storage.update('not-exist', { content: 'x' }), null);
});

test('remove 删除成功', () => {
  reset();
  const it = storage.create({ content: '删', date: '2026-07-25' });
  assert.strictEqual(storage.count(), 1);
  assert.ok(storage.remove(it.id));
  assert.strictEqual(storage.count(), 0);
  assert.ok(!storage.remove(it.id), '二次删除应失败');
});

test('getById 查找', () => {
  reset();
  const it = storage.create({ content: '找', date: '2026-07-25' });
  const got = storage.getById(it.id);
  assert.strictEqual(got.content, '找');
  assert.strictEqual(storage.getById('nope'), null);
});

test('search 关键词匹配正文/标签/心情', () => {
  reset();
  storage.create({ content: '清晨的咖啡', tags: ['生活'], mood: '☀️', date: '2026-07-25' });
  storage.create({ content: '雨下一整天', tags: ['工作'], mood: '🌧️', date: '2026-07-23' });
  assert.strictEqual(storage.search('咖啡').length, 1);
  assert.strictEqual(storage.search('工作').length, 1);
  assert.strictEqual(storage.search('🌧️').length, 1);
  assert.strictEqual(storage.search('').length, 2, '空关键词返回全部');
  assert.strictEqual(storage.search('XYZ不存在的词').length, 0);
});

test('search 大小写不敏感', () => {
  reset();
  storage.create({ content: 'Hello World', date: '2026-07-25' });
  assert.strictEqual(storage.search('hello').length, 1);
  assert.strictEqual(storage.search('WORLD').length, 1);
});

// ---------- 归档测试 ----------
test('getArchive 按月分组并倒序', () => {
  reset();
  storage.create({ content: 'a', date: '2026-05-10' });
  storage.create({ content: 'b', date: '2026-07-25' });
  storage.create({ content: 'c', date: '2026-07-01' });
  storage.create({ content: 'd', date: '2026-06-15' });
  const arch = storage.getArchive();
  assert.strictEqual(arch.length, 3);
  assert.strictEqual(arch[0].month, '2026-07');
  assert.strictEqual(arch[0].count, 2);
  assert.strictEqual(arch[1].month, '2026-06');
  assert.strictEqual(arch[2].month, '2026-05');
});

// ---------- 边界测试 ----------
test('空正文容错（trim 后空串仍可存）', () => {
  reset();
  const it = storage.create({ content: '   ', date: '2026-07-25' });
  assert.strictEqual(it.content, '');
});

test('空 tags / 非数组 tags 容错', () => {
  reset();
  const it = storage.create({ content: 'x', tags: null, date: '2026-07-25' });
  assert.deepStrictEqual(it.tags, []);
});

test('无 date 字段不进入归档', () => {
  reset();
  storage.create({ content: '无日期', date: '' });
  assert.strictEqual(storage.getArchive().length, 0);
});

test('超长正文保存完整', () => {
  reset();
  const long = '字'.repeat(10000);
  const it = storage.create({ content: long, date: '2026-07-25' });
  assert.strictEqual(it.content.length, 10000);
});

test('重复标签不合并（按用户输入原样）', () => {
  reset();
  const it = storage.create({ content: 'x', tags: ['生活', '生活'], date: '2026-07-25' });
  assert.strictEqual(it.tags.length, 2, '存储层不去重，去重由页面层处理');
});

// ---------- ID 唯一性压测（重点） ----------
test('ID 唯一性：批量新建 2000 条无重复 id', () => {
  reset();
  const N = 2000;
  for (let i = 0; i < N; i++) {
    storage.create({ content: 'd' + i, date: '2026-07-25', tags: ['t'] });
  }
  const list = storage.getAll();
  assert.strictEqual(list.length, N);
  const ids = new Set(list.map(it => it.id));
  assert.strictEqual(ids.size, N, '存在重复 id：' + (N - ids.size) + ' 个');
});

// ---------- 大规模性能压测 ----------
test('性能：1000 条搜索响应 < 200ms', () => {
  reset();
  const N = 1000;
  for (let i = 0; i < N; i++) {
    storage.create({
      content: '日记内容第' + i + '篇，包含关键词' + (i % 50 === 0 ? '稀有词' : '普通'),
      tags: ['标签' + (i % 10)],
      mood: '☀️',
      date: '2026-' + String((i % 12) + 1).padStart(2, '0') + '-15'
    });
  }
  const t0 = Date.now();
  const res = storage.search('稀有词');
  const cost = Date.now() - t0;
  assert.ok(res.length >= 20, '应找到含"稀有词"的记录');
  console.log(`\n      1000 条搜索耗时：${cost}ms，结果 ${res.length} 条`);
  assert.ok(cost < 200, '搜索耗时 ' + cost + 'ms 超过 200ms');
});

test('性能：5000 条 getAll 倒序 < 300ms', () => {
  reset();
  const N = 5000;
  for (let i = 0; i < N; i++) {
    storage.create({ content: 'p' + i, date: '2026-07-25' });
  }
  const t0 = Date.now();
  const list = storage.getAll();
  const cost = Date.now() - t0;
  assert.strictEqual(list.length, N);
  console.log(`      5000 条 getAll+排序耗时：${cost}ms`);
  assert.ok(cost < 300, 'getAll 耗时 ' + cost + 'ms 超过 300ms');
});

test('性能：5000 条归档分组 < 300ms', () => {
  reset();
  const N = 5000;
  for (let i = 0; i < N; i++) {
    const m = String((i % 12) + 1).padStart(2, '0');
    storage.create({ content: 'p' + i, date: '2026-' + m + '-15' });
  }
  const t0 = Date.now();
  const arch = storage.getArchive();
  const cost = Date.now() - t0;
  assert.strictEqual(arch.length, 12);
  console.log(`      5000 条归档分组耗时：${cost}ms`);
  assert.ok(cost < 300, '归档耗时 ' + cost + 'ms 超过 300ms');
});

test('稳定性：增删改混合操作后计数一致', () => {
  reset();
  const ids = [];
  for (let i = 0; i < 100; i++) {
    ids.push(storage.create({ content: 'mix' + i, date: '2026-07-25' }).id);
  }
  for (let i = 0; i < 50; i++) storage.remove(ids[i]);
  for (let i = 50; i < 100; i++) storage.update(ids[i], { content: 'updated' });
  assert.strictEqual(storage.count(), 50);
  const list = storage.getAll();
  assert.strictEqual(list.length, 50);
  assert.ok(list.every(it => it.content === 'updated' || it.content.startsWith('mix')));
});

// ---------- 输出报告 ----------
console.log('\n================ 压力测试报告 ================');
results.forEach(r => console.log(r));
console.log('============================================');
console.log(`通过：${pass}  失败：${fail}`);
process.exit(fail === 0 ? 0 : 1);
