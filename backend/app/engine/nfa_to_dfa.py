from dataclasses import dataclass, field
from typing import Dict, Set, FrozenSet

@dataclass
class NFA:
    states: Set[str]
    alphabet: Set[str]
    start: str
    finals: Set[str]
    transitions: Dict[str, Dict[str, Set[str]]]
    EPS: str = ""

    def eps_closure(self, S: Set[str]) -> Set[str]:
        stack = list(S)
        closure = set(S)
        while stack:
            s = stack.pop()
            for t in self.transitions.get(s, {}).get(self.EPS, set()):
                if t not in closure:
                    closure.add(t)
                    stack.append(t)
        return closure

    def move(self, S: Set[str], a: str) -> Set[str]:
        T = set()
        for s in S:
            T |= self.transitions.get(s, {}).get(a, set())
        return T

@dataclass
class DFA:
    states: Set[FrozenSet[str]] = field(default_factory=set)
    alphabet: Set[str] = field(default_factory=set)
    start: FrozenSet[str] = frozenset()
    finals: Set[FrozenSet[str]] = field(default_factory=set)
    transitions: Dict[FrozenSet[str], Dict[str, FrozenSet[str]]] = field(default_factory=dict)

def nfa_to_dfa(nfa: NFA) -> 'DFA':
    dfa = DFA(alphabet=set(nfa.alphabet))
    start_set = frozenset(nfa.eps_closure({nfa.start}))
    dfa.start = start_set
    dfa.states.add(start_set)
    if any(s in nfa.finals for s in start_set):
        dfa.finals.add(start_set)
    worklist = [start_set]
    dfa.transitions[start_set] = {}

    while worklist:
        S = worklist.pop()
        for a in nfa.alphabet:
            U = nfa.eps_closure(nfa.move(set(S), a))
            if not U: 
                continue
            Ufs = frozenset(U)
            if Ufs not in dfa.states:
                dfa.states.add(Ufs)
                worklist.append(Ufs)
                dfa.transitions[Ufs] = {}
                if any(s in nfa.finals for s in Ufs):
                    dfa.finals.add(Ufs)
            dfa.transitions[S][a] = Ufs
    return dfa
