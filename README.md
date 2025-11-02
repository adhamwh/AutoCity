# AutoCity (Backend-first Starter)

## Quickstart

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Endpoints:
- GET /api/health
- POST /api/automata/dafsa/build
- POST /api/automata/dafsa/add
- POST /api/automata/dafsa/search
- POST /api/automata/nfa_to_dfa
- GET/POST /api/fsm/traffic
- GET/POST /api/fsm/elevator
- GET/POST /api/fsm/vending
