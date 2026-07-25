// utils/theme.js — 深浅色模式管理

const KEY = 'THEME';

function getTheme() {
  return wx.getStorageSync(KEY) || 'light';
}

function setTheme(theme) {
  wx.setStorageSync(KEY, theme);
}

// 应用导航栏配色 + 窗口背景（overscroll 弹性区）
function applyNavBar(theme) {
  if (theme === 'dark') {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1F1B16'
    });
    wx.setBackgroundColor && wx.setBackgroundColor({
      backgroundColor: '#1F1B16',
      backgroundColorTop: '#1F1B16',
      backgroundColorBottom: '#1F1B16'
    });
  } else {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#F5F1EA'
    });
    wx.setBackgroundColor && wx.setBackgroundColor({
      backgroundColor: '#F5F1EA',
      backgroundColorTop: '#F5F1EA',
      backgroundColorBottom: '#F5F1EA'
    });
  }
}

module.exports = { getTheme, setTheme, applyNavBar };
