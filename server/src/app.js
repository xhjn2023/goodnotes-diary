import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB, getPool } from './config/database.js';
import diaryRouter from './routes/diary.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// 健康检查（含数据库状态）
app.get('/api/health', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      status: 'running',
      time: Date.now(),
      db: getPool() ? 'connected' : 'disconnected'
    }
  });
});

// 日记路由
app.use('/api/diaries', diaryRouter);

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('✗ Unhandled error:', err);
  res.status(500).json({ code: 500, message: err.message || 'internal error' });
});

// 启动服务
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✓ GoodNotes server running on http://localhost:${PORT}`);
    console.log(`  Health:  http://localhost:${PORT}/api/health`);
    console.log(`  Diaries: http://localhost:${PORT}/api/diaries`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
