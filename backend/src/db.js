const { createClient } = require('@libsql/client');
const path = require('path');

const DB_PATH = process.env.DB_PATH
  ? `file:${process.env.DB_PATH}`
  : `file:${path.join(__dirname, '../../thoughts.db')}`;

const db = createClient({ url: DB_PATH });

// ── Bootstrap: create tables if they don't exist ──────────────────
const bootstrap = async () => {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS migrations (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      name   TEXT    NOT NULL UNIQUE,
      run_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS thoughts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      raw_text   TEXT    NOT NULL,
      title      TEXT    NOT NULL,
      summary    TEXT    NOT NULL,
      tags       TEXT    NOT NULL DEFAULT '[]',
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_thoughts_created_at
      ON thoughts(created_at DESC);
  `);

  console.log('  ✓ Database ready');
};

module.exports = { db, bootstrap };
