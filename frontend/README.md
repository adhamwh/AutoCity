# AutoCity Frontend (Vite + React)
##  By: Adham Hijazi
### Theory of Computation Project

```bash
npm install
npm i -E d3@7.8.5 d3-graphviz@5.0.2 @hpcc-js/wasm@2.13.0
npm run dev
# open the printed local URL, by default http://localhost:5173
```

Make sure the backend is running (default http://127.0.0.1:8000). In the UI you can change the API base URL.
if its not running nothing will work :O.
Also make sure that the backend is running in a virtual env.

Includes:
- Chat panel -> POST /api/chat (+ lexicon loader)
- FSM controls -> /api/fsm/*
- DAFSA builder -> /api/automata/dafsa/build and /dafsa/dot
- NFA→DFA converter -> /api/automata/nfa_to_dfa
