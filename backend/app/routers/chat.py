from fastapi import APIRouter
from pydantic import BaseModel
from ..engine.chat_parser import ChatParser
from ..engine.fsm_traffic import TrafficLightFSM
from ..engine.fsm_elevator import ElevatorFSM
from ..engine.fsm_vending import VendingFSM
from ..engine.lexicon_dafsa import LexiconDAFSA

router = APIRouter()

# Singletons
parser = ChatParser()
traffic = TrafficLightFSM()
elevator = ElevatorFSM()
vending = VendingFSM()
lex = LexiconDAFSA()

class ChatIn(BaseModel):
    message: str

class LexPayload(BaseModel):
    # Example:
    # {"traffic":["traffic"], "next":["traffic_next"], "timer":["traffic_next"], "elevator":["elevator"], ...}
    lexmap: dict

@router.post("/chat/lexicon/load")
def chat_lexicon_load(p: LexPayload):
    lex.load(p.lexmap)
    return {"loaded": len(p.lexmap)}

@router.post("/chat")
def chat(in_: ChatIn):
    msg = in_.message
    # DAFSA-backed lexicon hints
    lexmatch = lex.query(msg)

    # Parse with NFA→DFA patterns + lexicon hints
    r = parser.parse(msg, lex_hints=lexmatch.hints)
    intent = r.get("intent")

    if intent == "traffic_next":
        traffic.send("timer")
        return {"reply": r["reply"], "state": traffic.state}

    if intent == "elevator_up":
        elevator.send("call_up"); elevator.send("arrive")
        return {"reply": r["reply"], "state": elevator.state, "floor": elevator.floor}

    if intent == "elevator_down":
        elevator.send("call_down"); elevator.send("arrive")
        return {"reply": r["reply"], "state": elevator.state, "floor": elevator.floor}

    if intent == "vending_coin":
        amt = int(r.get("credit_delta", 1))
        vending.send(f"coin_{amt}")
        return {"reply": r["reply"], "state": vending.state, "credit": vending.credit}

    if intent == "vending_select":
        vending.send("select")
        return {"reply": r["reply"], "state": vending.state, "credit": vending.credit}

    return {"reply": r["reply"], "intent": "unknown"}
