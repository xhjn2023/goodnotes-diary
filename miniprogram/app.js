// app.js — 全局应用逻辑
const theme = require('./utils/theme.js');

App({
  globalData: {
    theme: 'light',        // 'light' | 'dark'
    moods: ['☀️', '🌧️', '🍵', '✨', '🌙', '🍃', '😐']
  },

  onLaunch() {
    // 启动时加载主题偏好
    const saved = theme.getTheme();
    this.globalData.theme = saved;
    theme.applyNavBar(saved);
  },

  // 切换主题并持久化
  toggleTheme() {
    const next = this.globalData.theme === 'light' ? 'dark' : 'light';
    this.globalData.theme = next;
    theme.setTheme(next);
    theme.applyNavBar(next);
    return next;
  }
});
