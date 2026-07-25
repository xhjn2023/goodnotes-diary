// src/routes/diary.js — 日记 REST 路由
import { Router } from 'express';
import * as dao from '../dao/diaryDao.js';

const router = Router();

// 列表（可选 ?keyword=xxx 搜索 / ?month=YYYY-MM 过滤）
router.get('/', async (req, res, next) => {
  try {
    const { keyword } = req.query;
    let data = keyword
      ? await dao.search(keyword)
      : await dao.getAll();
    if (req.query.month) {
      data = data.filter(it => (it.date || '').slice(0, 7) === req.query.month);
    }
    res.json({ code: 0, message: 'ok', data });
  } catch (e) { next(e); }
});

// 详情
router.get('/:id', async (req, res, next) => {
  try {
    const data = await dao.getById(req.params.id);
    if (!data) return res.status(404).json({ code: 404, message: 'not found' });
    res.json({ code: 0, message: 'ok', data });
  } catch (e) { next(e); }
});

// 新建
router.post('/', async (req, res, next) => {
  try {
    const { content, mood, tags, date } = req.body || {};
    if (!date) return res.status(400).json({ code: 400, message: 'date 必填' });
    const data = await dao.create({ content, mood, tags, date });
    res.status(201).json({ code: 0, message: 'created', data });
  } catch (e) { next(e); }
});

// 更新
router.put('/:id', async (req, res, next) => {
  try {
    const data = await dao.update(req.params.id, req.body || {});
    if (!data) return res.status(404).json({ code: 404, message: 'not found' });
    res.json({ code: 0, message: 'updated', data });
  } catch (e) { next(e); }
});

// 删除
router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await dao.remove(req.params.id);
    if (!ok) return res.status(404).json({ code: 404, message: 'not found' });
    res.json({ code: 0, message: 'deleted' });
  } catch (e) { next(e); }
});

// 归档
router.get('/archive/list', async (req, res, next) => {
  try {
    const data = await dao.getArchive();
    res.json({ code: 0, message: 'ok', data });
  } catch (e) { next(e); }
});

export default router;
