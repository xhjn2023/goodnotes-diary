# GoodNotes 技术设计文档

> 版本:v1.0
> 更新日期:2026-07-14
> 文档负责人:技术组

---

## 1. 文档概述

### 1.1 文档目的
本文档定义 GoodNotes 笔记 App 的技术架构、模块设计、关键流程实现方案,作为开发实施的依据。

### 1.2 技术选型总览

| 层级 | 技术选型 | 选型理由 |
|------|---------|---------|
| 移动端框架 | React Native + Expo | 跨平台、生态完善、Expo 提供丰富原生模块 |
| 状态管理 | Zustand + React Query | 轻量、TypeScript 友好、缓存策略成熟 |
| 本地数据库 | expo-sqlite | 官方支持、性能稳定、支持 SQL 查询 |
| 富文本编辑 | react-native-pell-rich-editor | 基于 WebView,功能完善,可定制 |
| 后端框架 | Node.js + Express | 全栈 JS、生态丰富、开发效率高 |
| 数据库 | MongoDB | 文档型存储契合笔记数据结构 |
| 缓存 | Redis | 会话管理、限流、热点数据缓存 |
| 对象存储 | 阿里云 OSS / AWS S3 | 图片、附件存储 |
| 鉴权 | JWT + Refresh Token | 无状态、易扩展 |

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                    客户端 (React Native)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  UI 层   │  │ Store 层 │  │  API 层  │  │ DB 层  │ │
│  │ Screens  │→│ Zustand  │→│  Axios   │  │ SQLite │ │
│  │Components│  │   Query  │  │  Sync    │  │ Local  │ │
│  └──────────┘  └──────────┘  └────┬─────┘  └────────┘ │
└────────────────────────────────────┼────────────────────┘
                                     │ HTTPS
                                     ▼
┌─────────────────────────────────────────────────────────┐
│                    服务端 (Node.js)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Routes  │→│   Ctrl   │→│ Services │→│ Models │ │
│  │  Auth    │  │  Note    │  │  Sync    │  │ Mongo  │ │
│  │  Note    │  │  User    │  │  Notify  │  │ Redis  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────┐
│                       存储层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ MongoDB  │  │  Redis   │  │   OSS    │              │
│  │ 笔记数据 │  │  缓存    │  │ 文件存储 │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

### 2.2 关键设计原则

1. **离线优先 (Offline-First)**
   - 所有写操作先落本地 SQLite
   - UI 仅依赖本地数据,保证响应速度
   - 后台异步同步,网络异常不影响使用

2. **单一数据源 (Single Source of Truth)**
   - 客户端:SQLite 是唯一数据源
   - 服务端:MongoDB 是唯一数据源
   - 同步过程保证两端最终一致

3. **乐观更新 (Optimistic Update)**
   - 用户操作立即反馈 UI
   - 后台异步持久化
   - 失败时回滚 + 提示

---

## 3. 客户端架构

### 3.1 目录结构

```
mobile/
├── src/
│   ├── api/                    # API 请求层
│   │   ├── client.js           # Axios 实例
│   │   ├── auth.js             # 认证接口
│   │   ├── note.js             # 笔记接口
│   │   └── sync.js             # 同步接口
│   ├── components/             # 通用组件
│   │   ├── NoteCard/           # 笔记卡片
│   │   ├── RichEditor/         # 富文本编辑器
│   │   ├── TagChip/            # 标签
│   │   └── EmptyState/         # 空状态
│   ├── screens/                # 页面
│   │   ├── HomeScreen/         # 首页(笔记列表)
│   │   ├── NoteEditorScreen/   # 笔记编辑
│   │   ├── SearchScreen/       # 搜索
│   │   ├── NotebookScreen/     # 笔记本
│   │   ├── TagScreen/          # 标签
│   │   ├── SettingsScreen/     # 设置
│   │   └── AuthScreen/         # 登录注册
│   ├── store/                  # 状态管理
│   │   ├── useNoteStore.js     # 笔记状态
│   │   ├── useAuthStore.js     # 认证状态
│   │   └── useSettingStore.js  # 设置状态
│   ├── db/                     # 本地数据库
│   │   ├── schema.js           # 表结构
│   │   ├── noteDao.js          # 笔记 DAO
│   │   ├── tagDao.js           # 标签 DAO
│   │   └── syncDao.js          # 同步状态 DAO
│   ├── services/               # 业务服务
│   │   ├── syncService.js      # 同步服务
│   │   ├── authService.js      # 认证服务
│   │   └── storageService.js   # 文件服务
│   ├── utils/                  # 工具
│   │   ├── uuid.js             # ID 生成
│   │   ├── date.js             # 日期处理
│   │   └── crypto.js           # 加密
│   ├── theme/                  # 主题
│   │   ├── colors.js
│   │   └── typography.js
│   └── navigation/             # 路由
│       └── AppNavigator.js
├── assets/                     # 静态资源
├── app.json                    # Expo 配置
└── package.json
```

### 3.2 分层职责

| 层级 | 职责 | 不允许做 |
|------|------|---------|
| UI 层 (screens/components) | 渲染、用户交互 | 直接调 API、直接操作 DB |
| Store 层 (Zustand) | 应用状态、业务规则 | 直接调 API |
| API 层 | 网络请求、错误处理 | 操作 UI |
| DB 层 (DAO) | 本地数据持久化 | 业务逻辑 |
| Service 层 | 跨层协调(如同步) | 渲染 UI |

### 3.3 状态管理设计

```javascript
// store/useNoteStore.js
import { create } from 'zustand';

export const useNoteStore = create((set, get) => ({
  // 状态
  notes: [],
  currentNote: null,
  isLoading: false,

  // 操作
  loadNotes: async (notebookId = null) => {
    set({ isLoading: true });
    const notes = await noteDao.list(notebookId);
    set({ notes, isLoading: false });
  },

  createNote: async (data) => {
    const note = {
      id: uuid(),
      title: data.title || '',
      content: data.content || '',
      notebookId: data.notebookId || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: 'pending',  // pending | synced | conflict
      version: 1,
    };
    await noteDao.insert(note);
    set(state => ({ notes: [note, ...state.notes] }));
    // 触发后台同步
    syncService.enqueue();
    return note;
  },

  updateNote: async (id, updates) => {
    const note = await noteDao.getById(id);
    const updated = {
      ...note,
      ...updates,
      updatedAt: Date.now(),
      version: note.version + 1,
      syncStatus: 'pending',
    };
    await noteDao.update(updated);
    set(state => ({
      notes: state.notes.map(n => n.id === id ? updated : n)
    }));
    syncService.enqueue();
  },
}));
```

---

## 4. 服务端架构

### 4.1 目录结构

```
server/
├── src/
│   ├── config/                 # 配置
│   │   ├── database.js         # MongoDB 连接
│   │   ├── redis.js            # Redis 连接
│   │   └── env.js              # 环境变量
│   ├── models/                 # 数据模型
│   │   ├── User.js
│   │   ├── Note.js
│   │   ├── Notebook.js
│   │   └── Tag.js
│   ├── controllers/            # 控制器
│   │   ├── authController.js
│   │   ├── noteController.js
│   │   └── syncController.js
│   ├── routes/                 # 路由
│   │   ├── authRoutes.js
│   │   ├── noteRoutes.js
│   │   └── syncRoutes.js
│   ├── services/               # 业务服务
│   │   ├── authService.js
│   │   ├── syncService.js
│   │   └── notificationService.js
│   ├── middleware/             # 中间件
│   │   ├── auth.js             # JWT 验证
│   │   ├── errorHandler.js     # 错误处理
│   │   ├── rateLimiter.js      # 限流
│   │   └── validator.js        # 参数校验
│   └── app.js                  # 应用入口
├── package.json
└── .env.example
```

### 4.2 API 设计规范

**RESTful 风格**:

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| POST | /api/auth/refresh | 刷新 Token |
| GET | /api/notes | 获取笔记列表 |
| POST | /api/notes | 创建笔记 |
| PUT | /api/notes/:id | 更新笔记 |
| DELETE | /api/notes/:id | 删除笔记 |
| POST | /api/sync/push | 推送本地变更 |
| GET | /api/sync/pull | 拉取远端变更 |

**统一响应格式**:
```json
{
  "code": 0,           // 0=成功,非 0=失败
  "message": "success",
  "data": { ... },
  "timestamp": 1697164800000
}
```

---

## 5. 关键技术方案

### 5.1 离线优先与同步机制

#### 5.1.1 本地数据模型
```sql
-- 笔记表(本地)
CREATE TABLE notes (
  id TEXT PRIMARY KEY,           -- UUID,客户端生成
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',       -- HTML 内容
  notebook_id TEXT,
  is_pinned INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER,
  version INTEGER DEFAULT 1,     -- 乐观锁版本号
  sync_status TEXT DEFAULT 'pending',  -- pending|synced|conflict
  server_updated_at INTEGER      -- 服务端最后更新时间(用于增量拉取)
);

-- 同步状态表
CREATE TABLE sync_state (
  key TEXT PRIMARY KEY,
  value TEXT
);
-- 存储:last_sync_time、device_id 等
```

#### 5.1.2 同步流程

```
                  ┌─────────────────┐
                  │  syncService    │
                  │   .enqueue()    │
                  └────────┬────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ 1. 检查网络 & 登录态    │
              └────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ 2. 读取本地 sync_status=     │
        │    'pending' 的笔记          │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ 3. POST /api/sync/push       │
        │    body: { changes: [...] }  │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ 4. 服务端处理冲突,返回结果   │
        │    { applied: [], conflicts: []}│
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ 5. 更新本地 sync_status      │
        │    冲突项标记为 'conflict'   │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ 6. GET /api/sync/pull        │
        │    ?since=last_sync_time     │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ 7. 合并远端变更到本地        │
        │    更新 last_sync_time       │
        └──────────────────────────────┘
```

#### 5.1.3 冲突解决策略

```javascript
// server/src/services/syncService.js
async function pushChanges(userId, changes) {
  const results = { applied: [], conflicts: [] };

  for (const change of changes) {
    const serverNote = await Note.findOne({ id: change.id, userId });

    if (!serverNote) {
      // 服务端不存在,直接创建
      await Note.create({ ...change, userId });
      results.applied.push(change.id);
    } else if (change.version > serverNote.version) {
      // 客户端版本更新,更新服务端
      await Note.updateOne({ id: change.id }, change);
      results.applied.push(change.id);
    } else if (change.version < serverNote.version) {
      // 服务端版本更新,标记冲突
      results.conflicts.push({
        id: change.id,
        clientVersion: change,
        serverVersion: serverNote,
      });
    } else {
      // 版本相同,按 updatedAt 决策
      if (change.updatedAt > serverNote.updatedAt) {
        await Note.updateOne({ id: change.id }, change);
        results.applied.push(change.id);
      }
    }
  }
  return results;
}
```

### 5.2 富文本编辑器

#### 5.2.1 选型对比

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| react-native-pell-rich-editor | 功能完善、基于 WebView、可定制 | 性能略弱 | ✅ MVP 阶段 |
| 10tap-editor | 现代化、原生体验 | 收费、生态小 | 备选 |
| 自研基于 TextInput | 性能最好 | 开发成本高 | 后期考虑 |

#### 5.2.2 编辑器封装

```javascript
// components/RichEditor/index.js
import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { RichEditor as RNEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

const RichEditor = forwardRef(({ initialContent, onChange, placeholder }, ref) => {
  const editorRef = useRef(null);

  useImperativeHandle(ref, () => ({
    insertImage: (url) => editorRef.current?.insertImage(url),
    insertHTML: (html) => editorRef.current?.insertHTML(html),
    getContent: () => editorRef.current?.getContentHtml(),
  }));

  return (
    <>
      <RNEditor
        ref={editorRef}
        initialContentHTML={initialContent}
        onChange={onChange}
        placeholder={placeholder}
        useContainer={false}
        editorStyle={{ backgroundColor: 'transparent' }}
      />
      <RichToolbar
        editor={editorRef}
        actions={[
          actions.setBold, actions.setItalic, actions.setUnderline,
          actions.insertBulletsList, actions.insertOrderedList,
          actions.insertImage, actions.setStrikethrough,
        ]}
      />
    </>
  );
});
```

### 5.3 自动保存机制

```javascript
// 自动保存(防抖 + 失焦保存)
const saveNote = useMemo(
  () => debounce(async (content) => {
    await useNoteStore.getState().updateNote(noteId, { content });
  }, 1000),
  [noteId]
);

// 编辑器内容变化
const handleChange = (html) => {
  setContent(html);
  saveNote(html);
};

// 退出页面强制保存
useEffect(() => {
  return () => saveNote.flush();
}, []);
```

### 5.4 搜索实现

#### 5.4.1 本地全文搜索(SQLite FTS5)
```sql
-- 创建全文索引虚拟表
CREATE VIRTUAL TABLE notes_fts USING fts5(
  id UNINDEXED,
  title,
  content,
  content='notes',
  content_rowid='rowid'
);

-- 触发器保持同步
CREATE TRIGGER notes_ai AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, id, title, content)
  VALUES (new.rowid, new.id, new.title, new.content);
END;

-- 查询
SELECT n.* FROM notes n
JOIN notes_fts f ON n.id = f.id
WHERE notes_fts MATCH :keyword
  AND n.is_deleted = 0
ORDER BY rank;
```

### 5.5 鉴权方案

```
登录流程:
1. 用户提交账号密码
2. 服务端校验,生成 accessToken(2h) + refreshToken(30d)
3. 客户端存储到 SecureStore
4. 后续请求带 accessToken
5. accessToken 过期 → 用 refreshToken 换新
6. refreshToken 过期 → 重新登录
```

```javascript
// middleware/auth.js
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ code: 401, message: '未登录' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 4011, message: 'Token 过期' });
    }
    return res.status(401).json({ code: 401, message: 'Token 无效' });
  }
}
```

---

## 6. 数据安全设计

### 6.1 传输安全
- 全站 HTTPS + TLS 1.2+
- 证书 pinning(防中间人)
- API 请求签名(防篡改)

### 6.2 存储安全
- SQLite 数据库 AES-256 加密(SQLCipher)
- Token 存储 expo-secure-store(Keychain/Keystore)
- 敏感笔记单独加密

### 6.3 应用安全
- 生物识别锁屏(FaceID/指纹)
- 自动锁屏(可配置 1/5/15 分钟)
- 截屏保护(可选)

---

## 7. 性能优化策略

### 7.1 列表性能
- 使用 `FlashList` 替代 `FlatList`(性能提升 5x)
- 列表项高度缓存
- 图片懒加载 + 占位符

### 7.2 编辑器性能
- 长文档分块加载
- 滚动时暂停自动保存
- WebView 复用池

### 7.3 同步性能
- 增量同步(仅变更内容)
- 批量推送(合并多次操作)
- 压缩传输(gzip)

### 7.4 数据库优化
- 关键字段加索引(updated_at、sync_status)
- 分页查询(LIMIT + OFFSET)
- 定期清理回收站数据

---

## 8. 部署架构

```
                    ┌──────────────┐
                    │   Nginx      │
                    │  负载均衡     │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Node.js  │ │ Node.js  │ │ Node.js  │
        │ Server 1 │ │ Server 2 │ │ Server 3 │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             └────────────┼────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ MongoDB  │ │  Redis   │ │   OSS    │
        │  主从     │ │  哨兵    │ │  对象存储│
        └──────────┘ └──────────┘ └──────────┘
```

### 部署清单
- **服务器**:2 核 4G × 3 台(Node.js)
- **数据库**:MongoDB 4 核 8G(主) + 2 核 4G(从)
- **缓存**:Redis 2 核 4G
- **存储**:OSS 100GB 起步
- **CDN**:图片资源加速

---

## 9. 监控与日志

### 9.1 监控指标
- **业务指标**:笔记创建数、同步成功率、活跃用户
- **性能指标**:API 响应时间、错误率、QPS
- **系统指标**:CPU、内存、磁盘、网络

### 9.2 日志规范
```javascript
// 统一日志格式
{
  timestamp: '2026-07-14T10:00:00Z',
  level: 'info',
  userId: 'xxx',
  action: 'note.create',
  duration: 35,
  meta: { noteId: 'xxx' }
}
```

### 9.3 工具选型
- 应用监控:PM2 + Prometheus + Grafana
- 错误追踪:Sentry
- 日志收集:ELK (Elasticsearch + Logstash + Kibana)

---

## 10. 开发规范

### 10.1 代码规范
- ESLint + Prettier 统一格式
- 提交前 husky 自动校验
- Conventional Commits 提交规范

### 10.2 分支策略
```
main         # 生产分支
├── develop  # 开发分支
├── feature/xxx  # 功能分支
├── fix/xxx       # 修复分支
└── release/x.x.x # 发布分支
```

### 10.3 测试策略
| 类型 | 工具 | 覆盖率目标 |
|------|------|-----------|
| 单元测试 | Jest | ≥ 70% |
| 组件测试 | React Native Testing Library | 关键组件 |
| E2E 测试 | Detox | 核心流程 |
| API 测试 | Supertest | 所有接口 |

---

## 11. 风险与备选方案

| 风险点 | 主方案 | 备选方案 |
|-------|--------|---------|
| 富文本性能不足 | pell-rich-editor | 10tap-editor / 自研 |
| SQLite 加密复杂 | SQLCipher | expo-secure-store 存敏感字段 |
| 同步冲突难处理 | 版本号 + 时间戳 | CRDT 算法(Yjs) |
| MongoDB 扩展性 | 副本集 | 分片集群 |

---

## 12. 附录

### 12.1 关键依赖版本
```json
{
  "react-native": "0.73.x",
  "expo": "^50.0.0",
  "expo-sqlite": "^11.0.0",
  "react-native-pell-rich-editor": "^1.9.0",
  "zustand": "^4.5.0",
  "@tanstack/react-query": "^5.0.0",
  "express": "^4.18.0",
  "mongoose": "^8.0.0",
  "jsonwebtoken": "^9.0.0"
}
```

### 12.2 相关文档
- PRD 文档:`docs/PRD.md`
- 数据库设计:`docs/Database.md`
- API 接口文档:`docs/API.md`(后续输出)
