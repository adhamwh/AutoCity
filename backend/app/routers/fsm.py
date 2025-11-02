from fastapi import APIRouter
from pydantic import BaseModel
from ..engine.fsm_traffic import TrafficLightFSM
from ..engine.fsm_elevator import ElevatorFSM
from ..engine.fsm_vending import VendingFSM

router = APIRouter()

traffic = TrafficLightFSM()
elevator = ElevatorFSM()
vending = VendingFSM()

class Event(BaseModel):
    event: str

@router.get("/traffic")
def traffic_state():
    return {"state": traffic.state}

@router.post("/traffic")
def traffic_event(ev: Event):
    traffic.send(ev.event)
    return {"state": traffic.state}

@router.get("/elevator")
def elevator_state():
    return {"state": elevator.state, "floor": elevator.floor}

@router.post("/elevator")
def elevator_event(ev: Event):
    elevator.send(ev.event)
    return {"state": elevator.state, "floor": elevator.floor}

@router.get("/vending")
def vending_state():
    return {"state": vending.state, "credit": vending.credit}

@router.post("/vending")
def vending_event(ev: Event):
    vending.send(ev.event)
    return {"state": vending.state, "credit": vending.credit}
