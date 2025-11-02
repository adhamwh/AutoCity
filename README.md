# AutoCity 
## By: Adham Hijazi 
### Quickstart Guide:

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload


if http://127.0.0.1:8001 => Error 404 => Reading it before being loaded (No Problem).
Check http://127.0.0.1:8001/health if == ok # Ready to go. else Find the error and fix it.
go to http://127.0.0.1:8001/docs

Ports: 8000 - 8001 # Use either of these just save the URL later in the Frontend UI.
```

Starting Endpoints:
- GET /api/health
- POST /api/automata/dafsa/build
- POST /api/automata/dafsa/add
- POST /api/automata/dafsa/search
- POST /api/automata/nfa_to_dfa
- GET/POST /api/fsm/traffic
- GET/POST /api/fsm/elevator
- GET/POST /api/fsm/vending
- etc...



```bash
cd frontend
npm install
npm i -E d3@7.8.5 d3-graphviz@5.0.2 @hpcc-js/wasm@2.13.0 #Required to make visual graphs from DOT.
npm run dev
```