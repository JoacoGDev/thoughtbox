const express = require('express');
const { db } = require('../db');
const { analyseThought, findRelatedThoughts } = require('../services/ai');
const { validate, analyzeSchema } = require('../middleware/validate');

const router = express.Router();

const parseThought = (row) => ({
  ...row,
  tags:        JSON.parse(row.tags        || '[]'),
  connections: JSON.parse(row.connections || '[]'),
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

    // Enrich each thought with its related thoughts
    const enrichedThoughts = await Promise.all(
      result.rows.map(async (row) => {
        const parsed = parseThought(row);
        const relatedIds = JSON.parse(row.related_thought_ids || '[]');
        
        let relatedThoughts = [];
        if (relatedIds.length > 0) {
          const placeholders = relatedIds.map(() => '?').join(', ');
          const relatedResult = await db.execute({
            sql: `SELECT * FROM thoughts WHERE id IN (${placeholders})`,
            args: relatedIds,
          });
          relatedThoughts = relatedResult.rows.map(parseThought);
        }
        
        return { ...parsed, related: relatedThoughts };
      })
    );

    res.json(enrichedThoughts);
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
    
    const parsed = parseThought(result.rows[0]);
    const relatedIds = JSON.parse(result.rows[0].related_thought_ids || '[]');
    
    let relatedThoughts = [];
    if (relatedIds.length > 0) {
      const placeholders = relatedIds.map(() => '?').join(', ');
      const relatedResult = await db.execute({
        sql: `SELECT * FROM thoughts WHERE id IN (${placeholders})`,
        args: relatedIds,
      });
      relatedThoughts = relatedResult.rows.map(parseThought);
    }
    
    res.json({ ...parsed, related: relatedThoughts });
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

    // 2. Find related thoughts BEFORE saving (we need all existing thoughts)
    const allOthers = await db.execute({
      sql: 'SELECT * FROM thoughts ORDER BY created_at DESC',
      args: [],
    });

    // 3. Create a temporary thought object for findRelatedThoughts
    const tempThought = {
      title: analysis.title,
      summary: analysis.summary,
    };
    const related = await findRelatedThoughts(tempThought, allOthers.rows.map(parseThought));

    // 4. Save the new thought with related IDs
    const insertResult = await db.execute({
      sql: 'INSERT INTO thoughts (raw_text, title, summary, insight, connections, related_thought_ids, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [text, analysis.title, analysis.summary, analysis.insight, JSON.stringify(analysis.connections), JSON.stringify(related), JSON.stringify(analysis.tags)],
    });

    const newId = Number(insertResult.lastInsertRowid);
    const fetched = await db.execute({
      sql: 'SELECT * FROM thoughts WHERE id = ?',
      args: [newId],
    });
    const newThought = parseThought(fetched.rows[0]);

    // 5. Fetch full data of related thoughts
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