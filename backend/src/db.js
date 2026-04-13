const { createClient } = require('@libsql/client');
const path = require('path');

const DB_PATH = process.env.DB_PATH
  ? `file:${process.env.DB_PATH}`
  : `file:${path.join(__dirname, '../../thoughts.db')}`;

const db = createClient({ url: DB_PATH });

const bootstrap = async () => {
  // Base tables — only runs the first time
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS migrations (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      name   TEXT    NOT NULL UNIQUE,
      run_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS thoughts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      raw_text    TEXT    NOT NULL,
      title       TEXT    NOT NULL,
      summary     TEXT    NOT NULL,
      tags        TEXT    NOT NULL DEFAULT '[]',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_thoughts_created_at
      ON thoughts(created_at DESC);
  `);

  // Migrations — each runs exactly once
  await runMigration('003_add_insight_connections', async () => {
    await db.executeMultiple(`
      ALTER TABLE thoughts ADD COLUMN insight     TEXT NOT NULL DEFAULT '';
      ALTER TABLE thoughts ADD COLUMN connections TEXT NOT NULL DEFAULT '[]';
    `);
  });

  console.log('  ✓ Database ready');
};

const runMigration = async (name, fn) => {
  const existing = await db.execute({
    sql: 'SELECT id FROM migrations WHERE name = ?',
    args: [name],
  });
  if (existing.rows.length > 0) return;

  await fn();
  await db.execute({
    sql: 'INSERT INTO migrations (name) VALUES (?)',
    args: [name],
  });
  console.log(`  ✓ Migration: ${name}`);
};

module.exports = { db, bootstrap };