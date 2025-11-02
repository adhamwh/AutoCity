# AutoCity Frontend (Vite + React)

## Quickstart
```bash
npm install
npm run dev
# open the printed local URL, by default http://localhost:5173
```

Make sure the backend is running (default http://127.0.0.1:8000). In the UI you can change the API base URL.

Includes:
- Chat panel -> POST /api/chat (+ lexicon loader)
- FSM controls -> /api/fsm/*
- DAFSA builder -> /api/automata/dafsa/build and /dafsa/dot
- NFA→DFA converter -> /api/automata/nfa_to_dfa
