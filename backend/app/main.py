from fastapi import FastAPI
from .routers import automata, fsm, chat
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="AutoCity - Automata-Driven Smart City", version="0.1.0")

# --- CORS for the Vite dev server ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(automata.router, prefix="/api/automata", tags=["automata"])
app.include_router(fsm.router,       prefix="/api/fsm",      tags=["fsm"])
app.include_router(chat.router,      prefix="/api",          tags=["chat"])

@app.get("/api/health")
def health():
    return {"status": "ok"}
