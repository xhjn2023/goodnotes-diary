// pages/archive/archive.js — 归档页（按月归档浏览）
const app = getApp();
const storage = require('../../utils/storage.js');
const dateUtil = require('../../utils/date.js');

Page({
  data: {
    theme: 'light',
    archive: [],        // [{ month, monthText, count, items, expanded }]
    totalCount: 0
  },

  onShow() {
    const theme = app.globalData.theme;
    this.setData({ theme });
    this.refresh();
  },

  refresh() {
    const groups = storage.getArchive();
    const totalCount = groups.reduce((s, g) => s + g.count, 0);
    const archive = groups.map((g, i) => {
      const items = g.items.map(it => {
        const p = dateUtil.parse(it.date) || {};
        return {
          ...it,
          dayText: `${Number(p.month || 0)}/${Number(p.day || 0)}`,
          weekText: p.week || ''
        };
      });
      return {
        month: g.month,
        monthText: dateUtil.monthChinese(g.month),
        count: g.count,
        items,
        expanded: i === 0
      };
    });
    this.setData({ archive, totalCount });
  },

  // 展开/折叠月份
  onToggle(e) {
    const idx = e.currentTarget.dataset.idx;
    const key = `archive[${idx}].expanded`;
    this.setData({ [key]: !this.data.archive[idx].expanded });
  },

  // 点击日记 -> 编辑
  onTapItem(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/edit/edit?id=' + id });
  },

  // 返回首页
  onGotoHome() {
    wx.navigateBack();
  },

  onToggleTheme() {
    const next = app.toggleTheme();
    this.setData({ theme: next });
  }
});
