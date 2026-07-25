// utils/storage.js — 本地缓存数据层（日记增删改查）
// 使用 wx.storage 同步 API，所有日记存于单一 key，数组结构

const KEY = 'DIARIES';

// 模块级自增计数器，保证同毫秒内 id 也不重复
let _seq = 0;
function nextId() {
  _seq = (_seq + 1) % 1000000;
  return 'd' + Date.now().toString(36) + _seq.toString(36) + Math.random().toString(36).slice(2, 6);
}

// 读取全部日记（倒序：按日期 desc，同日期按 createdAt desc）
function getAll() {
  const list = wx.getStorageSync(KEY) || [];
  return list.slice().sort((a, b) => {
    const d = (b.date || '').localeCompare(a.date || '');
    if (d !== 0) return d;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

// 按 id 获取单条
function getById(id) {
  const list = wx.getStorageSync(KEY) || [];
  return list.find(it => it.id === id) || null;
}

// 新建日记，返回保存后的对象
function create(data) {
  const list = wx.getStorageSync(KEY) || [];
  const now = Date.now();
  const item = {
    id: nextId(),
    content: (data.content || '').trim(),
    mood: data.mood || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    date: data.date || '',         // 'YYYY-MM-DD'
    createdAt: now,
    updatedAt: now
  };
  list.push(item);
  wx.setStorageSync(KEY, list);
  return item;
}

// 更新日记
function update(id, patch) {
  const list = wx.getStorageSync(KEY) || [];
  const idx = list.findIndex(it => it.id === id);
  if (idx === -1) return null;
  const next = {
    ...list[idx],
    ...patch,
    content: (patch.content !== undefined ? patch.content : list[idx].content).trim(),
    tags: patch.tags !== undefined ? patch.tags : list[idx].tags,
    updatedAt: Date.now()
  };
  list[idx] = next;
  wx.setStorageSync(KEY, list);
  return next;
}

// 删除日记
function remove(id) {
  const list = wx.getStorageSync(KEY) || [];
  const next = list.filter(it => it.id !== id);
  wx.setStorageSync(KEY, next);
  return next.length !== list.length;
}

// 关键词搜索（标题=正文前若干字 + 正文 + 标签）
function search(keyword) {
  const kw = (keyword || '').trim().toLowerCase();
  if (!kw) return getAll();
  return getAll().filter(it => {
    const hay = [
      it.content || '',
      (it.tags || []).join(' '),
      it.mood || ''
    ].join(' ').toLowerCase();
    return hay.indexOf(kw) !== -1;
  });
}

// 按月归档：返回 [{ month: 'YYYY-MM', count, items: [...] }] 倒序
function getArchive() {
  const all = getAll();
  const map = {};
  all.forEach(it => {
    const m = (it.date || '').slice(0, 7); // 'YYYY-MM'
    if (!m) return;
    if (!map[m]) map[m] = { month: m, count: 0, items: [] };
    map[m].count++;
    map[m].items.push(it);
  });
  return Object.values(map).sort((a, b) => b.month.localeCompare(a.month));
}

// 统计
function count() {
  const list = wx.getStorageSync(KEY) || [];
  return list.length;
}

module.exports = {
  KEY,
  getAll,
  getById,
  create,
  update,
  remove,
  search,
  getArchive,
  count
};
