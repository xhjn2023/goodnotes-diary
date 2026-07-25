// utils/date.js — 日期处理工具

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

// Date -> 'YYYY-MM-DD'
function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 今天 'YYYY-MM-DD'
function today() {
  return toISO(new Date());
}

// 'YYYY-MM-DD' -> { year, month, day, week }；非法日期返回 null
function parse(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const parts = iso.split('-');
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(day)) return null;
  const d = new Date(y, m - 1, day);
  // 校验日期真实有效（拒绝 2月30日 / 13月 等）
  if (d.getFullYear() !== y || d.getMonth() !== m - 1 || d.getDate() !== day) return null;
  const mm = String(m).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return {
    year: String(y),
    month: mm,
    day: dd,
    week: '周' + WEEK[d.getDay()],
    monthEn: ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()]
  };
}

// 中文长日期 'YYYY年M月D日 周X'
function toChinese(iso) {
  const p = parse(iso);
  if (!p) return '';
  return `${p.year}年${Number(p.month)}月${Number(p.day)}日 ${p.week}`;
}

// 'YYYY-MM-DD' -> 'M月D日'
function shortChinese(iso) {
  const p = parse(iso);
  if (!p) return '';
  return `${Number(p.month)}月${Number(p.day)}日`;
}

// 'YYYY-MM' -> 'YYYY年M月'
function monthChinese(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${y}年${Number(m)}月`;
}

module.exports = {
  WEEK,
  toISO,
  today,
  parse,
  toChinese,
  shortChinese,
  monthChinese
};
