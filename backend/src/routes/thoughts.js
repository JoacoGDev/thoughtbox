const express = require('express');
const { db } = require('../db');
const { analyseThought, findRelatedThoughts } = require('../services/ai');
const { validate, analyzeSchema } = require('../middleware/validate');

const router = express.Router();

const parseThought = (row) => ({
  ...row,
  tags: JSON.parse(row.tags || '[]'),
});

// GET /api/thoughts
router.get('/', async (req, res, next) => {
  try {
    const { tag } = req.query;
    let result;

    if (tag) {
      result = await db.execute({
        sql: `SELECT * FROM thoughts WHERE tags LIKE ? ORDER BY created_at DESC`,
        args: [`%"${tag}"%`],
      });
    } else {
      result = await db.execute('SELECT * FROM thoughts ORDER BY created_at DESC');
    }

    res.json(result.rows.map(parseThought));
  } catch (err) {
    next(err);
  }
});

// GET /api/thoughts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM thoughts WHERE id = ?',
      args: [req.params.id],
    });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Thought not found' });
    res.json(parseThought(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

// POST /api/thoughts/analyze
router.post('/analyze', validate(analyzeSchema), async (req, res, next) => {
  const { text } = req.body;
  try {
    // 1. Analyse the new thought
    const analysis = await analyseThought(text);

    // 2. Save it
    const insertResult = await db.execute({
      sql: 'INSERT INTO thoughts (raw_text, title, summary, tags) VALUES (?, ?, ?, ?)',
      args: [text, analysis.title, analysis.summary, JSON.stringify(analysis.tags)],
    });

    const newId = Number(insertResult.lastInsertRowid);
    const fetched = await db.execute({
      sql: 'SELECT * FROM thoughts WHERE id = ?',
      args: [newId],
    });
    const newThought = parseThought(fetched.rows[0]);

    // 3. Find related thoughts (excluding the one we just saved)
    const allOthers = await db.execute({
      sql: 'SELECT * FROM thoughts WHERE id != ? ORDER BY created_at DESC',
      args: [newId],
    });
    const related = await findRelatedThoughts(newThought, allOthers.rows.map(parseThought));

    // 4. Fetch full data of related thoughts
    let relatedThoughts = [];
    if (related.length > 0) {
      const placeholders = related.map(() => '?').join(', ');
      const relatedResult = await db.execute({
        sql: `SELECT * FROM thoughts WHERE id IN (${placeholders})`,
        args: related,
      });
      relatedThoughts = relatedResult.rows.map(parseThought);
    }

    res.status(201).json({ ...newThought, related: relatedThoughts });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/thoughts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM thoughts WHERE id = ?',
      args: [req.params.id],
    });
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Thought not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;