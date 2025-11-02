from dataclasses import dataclass
from typing import Literal, Optional, Set, List
from .patterns import compile_contains_sequence, dfa_accepts

Intent = Literal["traffic_next","elevator_up","elevator_down","vending_coin","vending_select","unknown"]

class ChatParser:
    def __init__(self):
        # NFA→DFA patterns (compiled once)
        self.p_traffic = compile_contains_sequence(
            "traffic_next",
            [ {"traffic"}, {"next","timer","advance"} ]
        )
        self.p_elev_up = compile_contains_sequence(
            "elevator_up",
            [ {"elevator"}, {"up","↑"} ]
        )
        self.p_elev_down = compile_contains_sequence(
            "elevator_down",
            [ {"elevator"}, {"down","↓"} ]
        )

    def parse(self, msg: str, lex_hints: Set[str] = frozenset()) -> dict:
        tokens: List[str] = msg.lower().split()

        # 1) Pattern-based intents (strongest)
        if dfa_accepts(self.p_traffic.dfa, tokens):
            return {"intent":"traffic_next","reply":"Traffic advanced"}

        if dfa_accepts(self.p_elev_up.dfa, tokens):
            return {"intent":"elevator_up","reply":"Elevator moved up"}

        if dfa_accepts(self.p_elev_down.dfa, tokens):
            return {"intent":"elevator_down","reply":"Elevator moved down"}

        # 2) DAFSA lexicon fallback for vending
        if "vending" in lex_hints and ("coin" in tokens or any(t.isdigit() for t in tokens)):
            amt = next((t for t in tokens if t.isdigit()), "1")
            return {"intent":"vending_coin","reply":f"Inserted {amt}","credit_delta":int(amt)}

        if "vending" in lex_hints and "select" in tokens:
            return {"intent":"vending_select","reply":"Selected item"}

        # 3) Unknown
        return {"intent":"unknown","reply":"Sorry, I didn't get that."}
