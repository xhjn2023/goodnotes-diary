# GoodNotes Diary · 日记小程序

> 极简护眼风格的微信日记小程序，含 4 个差异化设计方向 HTML 原型 + Supabase PostgreSQL 服务端。

## 目录结构

```
goodnotes/
├── miniprogram/        # 微信小程序工程（WXML+WXSS+JS）
├── prototypes/         # 4 个设计方向 HTML 原型
├── server/             # Express + Supabase PostgreSQL 服务端
├── test/               # 数据层压力测试
└── docs/               # 产品/设计/数据库文档
```

## 功能特性

- 新建日记：自动填充系统日期，支持手动修改；包含正文、心情、标签
- 本地缓存存储 + Supabase 云端同步
- 日记列表按日期倒序，支持查看/编辑/删除
- 关键词搜索 + 按月归档浏览
- 深色/浅色模式一键切换并记忆偏好

## 设计方向（4 个）

| 方向 | 风格 | 交互 |
|---|---|---|
| ① 纸张墨韵 | 米黄纸张 + 蜂蜜琥珀，衬线复古 | 横向时间线 |
| ② 晨雾莫兰迪 | 低饱和雾灰 + 豆沙粉，极简留白 | 瀑布流卡片 |
| ③ 深夜电台 | 深墨蓝 + 暖琥珀光晕，沉浸深色 | 频段调谐 |
| ④ 植物园 | 鼠尾草绿 + 奶油白，自然有机 | 抽屉式侧滑 |

打开 `prototypes/index.html` 预览全部方向。

## 快速开始

### 小程序
用微信开发者工具导入 `miniprogram/` 目录即可。

### 服务端
```bash
cd server
npm install
cp .env.example .env   # 填入 Supabase DATABASE_URL
node scripts/init-db.js   # 建表
npm start                 # http://localhost:3000
```

### 测试
```bash
node test/stress.test.js        # 数据层 26 项压力测试
node server/scripts/test-api.mjs # API CRUD 测试
```

## 技术栈

- 小程序：原生 WXML + WXSS + JS + wx.storage
- 服务端：Node.js + Express + node-postgres
- 数据库：Supabase PostgreSQL（PGBouncer 池模式）
