backend/
├── src/
│   ├── index.js          # Express app entry point
│   ├── db.js             # SQLite connection + migrations
│   ├── routes/
│   │   └── thoughts.js   # All /thoughts routes
│   ├── services/
│   │   └── ai.js         # Anthropic API logic
│   └── middleware/
│       └── validate.js   # Zod request validation
├── .env.example
├── .gitignore
└── package.json
