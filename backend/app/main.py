from fastapi import FastAPI
from .routers import automata, fsm, chat

app = FastAPI(title="AutoCity - Automata-Driven Smart City")

app.include_router(automata.router, prefix="/api/automata", tags=["automata"])
app.include_router(fsm.router,       prefix="/api/fsm",      tags=["fsm"])
app.include_router(chat.router,      prefix="/api",          tags=["chat"])

@app.get("/api/health")
def health():
    return {"status": "ok"}
