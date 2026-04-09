# Thoughtbox ✦

> Capture any thought. Let AI title, summarise, and tag it for you.

## Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18 + Vite                   |
| Backend  | Node.js 18+ + Express             |
| Database | SQLite via `@libsql/client`       |
¿

---

## Quick start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Add your API key

```bash
# Windows
copy backend\.env.example backend\.env

# Mac / Linux
cp backend/.env.example backend/.env
```

Open `backend/.env` and paste your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get a key at https://console.anthropic.com

### 3. Start the servers

Because `&` doesn't work in Windows PowerShell, open **two terminals**:

**Terminal 1 — backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Project structure

```
thoughtbox/
├── backend/
│   ├── src/
│   │   ├── index.js               # Express app + all middleware
│   │   ├── db.js                  # SQLite connection + table setup
│   │   ├── routes/
│   │   │   └── thoughts.js        # GET, POST /analyze, DELETE
│   │   ├── services/
│   │   │   └── ai.js              # Anthropic API + retry logic
│   │   └── middleware/
│   │       └── validate.js        # Zod request validation
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js                 # All fetch() calls in one place
│   │   ├── index.css
│   │   ├── main.jsx
│   │   ├── components/
│   │   │   ├── ThoughtCard.jsx
│   │   │   ├── ThoughtForm.jsx
│   │   │   └── TagFilter.jsx
│   │   └── hooks/
│   │       └── useThoughts.js     # All state + data fetching
│   ├── index.html
│   ├── vite.config.js             # Proxies /api → localhost:3001
│   └── package.json
├── .gitignore
└── package.json                   # install:all script
```

---

## API reference

| Method | Endpoint                  | Description               |
|--------|---------------------------|---------------------------|
| GET    | `/api/thoughts`           | List all thoughts         |
| GET    | `/api/thoughts?tag=foo`   | Filter by tag             |
| GET    | `/api/thoughts/:id`       | Get one thought           |
| POST   | `/api/thoughts/analyze`   | Analyse + save a thought  |
| DELETE | `/api/thoughts/:id`       | Delete a thought          |
| GET    | `/health`                 | Server health check       |

### POST /api/thoughts/analyze — request body
```json
{ "text": "Your raw thought here" }
```

### Response
```json
{
  "id": 1,
  "raw_text": "Your raw thought here",
  "title": "AI-generated title",
  "summary": "One-sentence summary.",
  "tags": ["tag-one", "tag-two"],
  "created_at": "2025-01-01T12:00:00"
}
```

---

## Why each technology was chosen

**`@libsql/client` instead of `better-sqlite3`**
`better-sqlite3` is a native C++ addon — on Windows it requires Microsoft Visual Studio Build Tools to compile, which is a multi-GB install. `@libsql/client` is pure JavaScript, works on any OS out of the box, and reads/writes the exact same SQLite `.db` file format.

**`node --watch` instead of `nodemon`**
Node 18+ ships with a built-in `--watch` flag that restarts the process when files change. No extra dependency needed.

**Vite proxy**
`vite.config.js` proxies `/api` → `http://localhost:3001` during development. This means the browser only ever talks to port 5173 — no CORS issues, no headers to configure, and your API key stays on the server.

---

## What you'll learn from this codebase

- **Express middleware chain** — security (Helmet), CORS, rate limiting, body parsing, logging, error handling — all in the right order
- **Layered architecture** — routes → services → external APIs, one job per file
- **Zod validation** — typed, declarative request validation with useful error messages
- **Async SQLite** — `@libsql/client` uses `async/await`, the standard pattern in Node
- **Anthropic SDK** — structured prompting, JSON output parsing, retry on failure
- **React custom hooks** — all state and fetching in `useThoughts`, components are pure UI
- **API key safety** — key lives only in `.env`, loaded server-side, never reaches the browser

---

## Next steps (Stage 3 ideas)

- [ ] Keyword search across thoughts
- [ ] Related thoughts — send all saved thoughts to Claude, ask it to find connections
- [ ] Edit tags manually
- [ ] Export to Markdown
- [ ] User authentication
