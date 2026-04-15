# Thoughtbox

> Capture raw thoughts and turn them into structured notes with AI.

Thoughtbox is a lightweight full-stack application that helps users save ideas quickly and organise them automatically. You write a raw thought, and the app uses the OpenAI API to generate a clear title, a concise summary, and useful tags for retrieval.

It is designed as a small but solid project that demonstrates a practical AI workflow, a clean frontend/backend separation, and safe API-key handling.

---

## Features

- Capture raw thoughts in plain language
- Generate an AI-powered title, summary, and tags
- Store thoughts in a local SQLite database
- Browse all saved thoughts in a clean interface
- Filter thoughts by tag
- Delete thoughts when no longer needed
- Keep the OpenAI API key securely on the backend only

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js 18+ + Express |
| Database | SQLite via `@libsql/client` |
| Validation | Zod |
| AI | OpenAI API |

---

## How it works

1. The user writes a raw thought in the frontend.
2. The frontend sends that text to the backend.
3. The backend calls the OpenAI API.
4. The AI returns structured output:
   - title
   - summary
   - tags
5. The backend saves the result to SQLite.
6. The frontend refreshes and displays the new thought.

This keeps the browser simple and prevents the API key from ever being exposed client-side.

---

## Project structure

```text
thoughtbox/
├── backend/
│   ├── src/
│   │   ├── index.js               # Express app + middleware setup
│   │   ├── db.js                  # SQLite connection + schema setup
│   │   ├── routes/
│   │   │   └── thoughts.js        # Thought routes
│   │   ├── services/
│   │   │   └── ai.js              # OpenAI integration + response parsing
│   │   └── middleware/
│   │       └── validate.js        # Zod request validation
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js                 # API calls
│   │   ├── index.css
│   │   ├── main.jsx
│   │   ├── components/
│   │   │   ├── ThoughtCard.jsx
│   │   │   ├── ThoughtForm.jsx
│   │   │   └── TagFilter.jsx
│   │   └── hooks/
│   │       └── useThoughts.js     # State management + data fetching
│   ├── index.html
│   ├── vite.config.js             # Dev proxy for /api
│   └── package.json
├── .gitignore
└── package.json                   # Root scripts
```

---

## Requirements

Before running the project, make sure you have:

- Node.js 18 or newer
- npm
- An OpenAI API key

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/thoughtbox.git
cd thoughtbox
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Create the environment file

**Windows**

```bash
copy backend\.env.example backend\.env
```

**macOS / Linux**

```bash
cp backend/.env.example backend/.env
```

### 4. Add your OpenAI API key

Open `backend/.env` and set:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

You can create an API key from the OpenAI Platform dashboard.

---

## Running the project

Because running both servers from a single root command may not work reliably on every shell, the safest approach is to use two terminals.

### Terminal 1 — backend

```bash
cd backend
npm run dev
```

### Terminal 2 — frontend

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

## Environment variables

The backend uses a `.env` file.

### Required

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Do not expose this key in the frontend.

---

## API reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/thoughts` | List all thoughts |
| GET | `/api/thoughts?tag=foo` | Filter thoughts by tag |
| GET | `/api/thoughts/:id` | Get a single thought |
| POST | `/api/thoughts/analyze` | Analyze and save a new thought |
| DELETE | `/api/thoughts/:id` | Delete a thought |
| GET | `/health` | Health check |

### Example request

**POST** `/api/thoughts/analyze`

```json
{
  "text": "Plato's concept of forms may explain why abstract patterns feel more real than the things that imitate them."
}
```

### Example response

```json
{
  "id": 1,
  "raw_text": "Plato's concept of forms may explain why abstract patterns feel more real than the things that imitate them.",
  "title": "Plato and abstract reality",
  "summary": "A reflection on Plato's theory of forms and why abstract structures can feel more fundamental than physical copies.",
  "tags": ["philosophy", "plato", "abstraction"],
  "created_at": "2026-04-15T12:00:00Z"
}
```

---

## Development notes

### Why `@libsql/client`?

`@libsql/client` works well for lightweight local persistence and avoids the native compilation issues that can appear with alternatives such as `better-sqlite3`, especially on Windows.

### Why a backend for AI calls?

The OpenAI API key must remain private. By placing AI logic in the backend:

- the key stays server-side
- prompts can be controlled centrally
- validation and retries are easier to manage
- the frontend remains simpler

### Why Vite proxy?

During development, Vite proxies `/api` requests to the Express server. This makes local development cleaner and avoids common CORS issues.

---

## What this project demonstrates

This project is intentionally small, but it shows several useful real-world patterns:

- Express middleware setup
- request validation with Zod
- separation between routes, services, and data access
- safe environment variable handling
- integrating an LLM into a web application
- React state management with custom hooks
- local persistence with SQLite

---

## Possible next improvements

- Full-text search across thoughts
- Manual editing for titles, summaries, or tags
- Related thoughts and connection suggestions
- Export to Markdown or JSON
- User authentication
- Pagination for larger datasets

---

## Scripts

### Root

```bash
npm run install:all
```

## Running the app

Run everything with a single command from the project root:

```bash
npm run dev

```bash
npm run dev
```

---

