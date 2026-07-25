// pages/edit/edit.js — 写日记 / 编辑日记
const app = getApp();
const storage = require('../../utils/storage.js');
const dateUtil = require('../../utils/date.js');

Page({
  data: {
    theme: 'light',
    isEdit: false,       // 是否编辑已有日记
    id: '',
    date: '',            // 'YYYY-MM-DD'
    dateText: '',        // 'YYYY年M月D日 周X'
    mood: '',
    tags: [],
    tagInput: '',
    content: '',
    moods: [],
    charCount: 0
  },

  onLoad(options) {
    const theme = app.globalData.theme;
    const moods = app.globalData.moods;
    if (options && options.id) {
      // 编辑模式
      const it = storage.getById(options.id);
      if (it) {
        this.setData({
          theme, moods,
          isEdit: true,
          id: it.id,
          date: it.date,
          dateText: dateUtil.toChinese(it.date),
          mood: it.mood || '',
          tags: it.tags || [],
          content: it.content || '',
          charCount: (it.content || '').length
        });
        wx.setNavigationBarTitle({ title: '编辑日记' });
        return;
      }
    }
    // 新建模式：自动填充系统日期
    const today = dateUtil.today();
    this.setData({
      theme, moods,
      date: today,
      dateText: dateUtil.toChinese(today)
    });
  },

  onShow() {
    // 同步主题
    const theme = app.globalData.theme;
    if (theme !== this.data.theme) this.setData({ theme });
  },

  // 日期选择
  onDateChange(e) {
    const date = e.detail.value;
    this.setData({
      date,
      dateText: dateUtil.toChinese(date)
    });
  },

  // 心情选择
  onPickMood(e) {
    const mood = e.currentTarget.dataset.mood;
    this.setData({ mood: this.data.mood === mood ? '' : mood });
  },

  // 标签输入
  onTagInput(e) {
    this.setData({ tagInput: e.detail.value });
  },
  onAddTag() {
    const t = (this.data.tagInput || '').trim();
    if (!t) return;
    if (this.data.tags.indexOf(t) !== -1) {
      wx.showToast({ title: '标签已存在', icon: 'none' });
      return;
    }
    if (this.data.tags.length >= 8) {
      wx.showToast({ title: '最多8个标签', icon: 'none' });
      return;
    }
    this.setData({ tags: [...this.data.tags, t], tagInput: '' });
  },
  onRemoveTag(e) {
    const idx = e.currentTarget.dataset.idx;
    const tags = this.data.tags.slice();
    tags.splice(idx, 1);
    this.setData({ tags });
  },

  // 正文输入
  onContentInput(e) {
    const v = e.detail.value;
    this.setData({ content: v, charCount: v.length });
  },

  // 保存
  onSave() {
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请写点什么吧', icon: 'none' });
      return;
    }
    if (!this.data.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }
    const payload = {
      content: this.data.content,
      mood: this.data.mood,
      tags: this.data.tags,
      date: this.data.date
    };
    if (this.data.isEdit) {
      storage.update(this.data.id, payload);
    } else {
      storage.create(payload);
    }
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  },

  // 返回（带未保存提示）
  onBack() {
    if (this.data.content.trim()) {
      wx.showModal({
        title: '未保存',
        content: '放弃这次编辑吗？',
        confirmColor: '#BE5A48',
        success: r => { if (r.confirm) wx.navigateBack(); }
      });
    } else {
      wx.navigateBack();
    }
  }
});
