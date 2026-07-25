// pages/home/home.js — 首页日记列表
const app = getApp();
const storage = require('../../utils/storage.js');
const dateUtil = require('../../utils/date.js');

Page({
  data: {
    theme: 'light',
    diaries: [],        // 处理后的卡片数据
    timeline: [],       // 月份时间线 [{key, label, active}]
    activeMonth: '',    // 当前选中月份 'YYYY-MM'，空=全部
    keyword: '',
    totalCount: 0,
    moods: []
  },

  onShow() {
    const theme = app.globalData.theme;
    this.setData({ theme, moods: app.globalData.moods });
    this.refresh();
  },

  // 加载并处理日记数据
  refresh() {
    const all = storage.getAll();
    const totalCount = all.length;

    // 构建月份时间线（有日记的月份 + 当月，去重倒序）
    const monthSet = {};
    all.forEach(it => {
      const m = (it.date || '').slice(0, 7);
      if (m) monthSet[m] = true;
    });
    monthSet[dateUtil.today().slice(0, 7)] = true;
    const timeline = Object.keys(monthSet).sort((a, b) => b.localeCompare(a)).map(m => ({
      key: m,
      label: this.monthShort(m),
      active: m === this.data.activeMonth
    }));

    // 若没有选中月份，默认选最新月份
    let activeMonth = this.data.activeMonth;
    if (!activeMonth && timeline.length) {
      activeMonth = timeline[0].key;
      timeline.forEach(it => it.active = it.key === activeMonth);
    }

    // 卡片数据：附加日期文本
    let list = all.map(it => this.decorate(it));

    // 关键词过滤（全局搜索，不受月份限制，便于跨月查找）
    const kw = (this.data.keyword || '').trim().toLowerCase();
    if (kw) {
      list = list.filter(it => {
        const hay = [it.content, (it.tags || []).join(' '), it.mood].join(' ').toLowerCase();
        return hay.indexOf(kw) !== -1;
      });
    } else if (activeMonth) {
      // 无关键词时按所选月份过滤
      list = list.filter(it => (it.date || '').slice(0, 7) === activeMonth);
    }

    this.setData({ diaries: list, timeline, totalCount, activeMonth });
  },

  // 装饰单条日记，加入展示文本
  decorate(it) {
    const p = dateUtil.parse(it.date) || { day: '', month: '', week: '', monthEn: '' };
    return {
      ...it,
      dayText: p.day || '--',
      monthText: p.monthEn || '',
      weekText: p.week || ''
    };
  },

  monthShort(ym) {
    const [y, m] = ym.split('-');
    return `${Number(m)}月`;
  },

  // 选择月份
  onPickMonth(e) {
    const key = e.currentTarget.dataset.key;
    const activeMonth = this.data.activeMonth === key ? '' : key;
    this.setData({ activeMonth }, () => this.refresh());
  },

  // 搜索输入
  onSearch(e) {
    this.setData({ keyword: e.detail.value }, () => this.refresh());
  },
  onClearSearch() {
    this.setData({ keyword: '' }, () => this.refresh());
  },

  // 新建日记
  onNew() {
    wx.navigateTo({ url: '/pages/edit/edit' });
  },

  // 点击卡片 -> 编辑
  onCardTap(e) {
    wx.navigateTo({ url: '/pages/edit/edit?id=' + e.detail.id });
  },

  // 删除日记
  onCardDelete(e) {
    const id = e.detail.id;
    wx.showModal({
      title: '删除日记',
      content: '确定删除这篇日记吗？此操作不可恢复。',
      confirmColor: '#BE5A48',
      success: res => {
        if (res.confirm) {
          storage.remove(id);
          this.refresh();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  // 切换主题
  onToggleTheme() {
    const next = app.toggleTheme();
    this.setData({ theme: next }, () => this.refresh());
  },

  // 跳转归档
  onGotoArchive() {
    wx.navigateTo({ url: '/pages/archive/archive' });
  }
});
