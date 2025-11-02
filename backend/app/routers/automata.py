from fastapi import APIRouter
from fastapi import Response
from pydantic import BaseModel
from ..engine.dafsa import DAFSA
from ..engine.nfa_to_dfa import NFA, DFA, nfa_to_dfa
from ..engine.dafsa import DAFSA, Node  # ensure Node is importable



router = APIRouter()

dafsa = DAFSA()

class DAFSAAdd(BaseModel):
    word: str

class DAFSASearch(BaseModel):
    word: str

@router.post("/dafsa/build")
def dafsa_build(words: list[str]):
    global dafsa
    dafsa = DAFSA()
    for w in sorted(words):
        dafsa.add(w)
    # NEW: minimize after bulk build
    dafsa.minimize()
    return {"states": dafsa.num_states(), "words": len(words)}


@router.post("/dafsa/add")
def dafsa_add(item: DAFSAAdd):
    dafsa.add(item.word)
    return {"added": item.word, "states": dafsa.num_states()}

@router.post("/dafsa/search")
def dafsa_search(item: DAFSASearch):
    return {"word": item.word, "exists": dafsa.search(item.word)}

class NFADef(BaseModel):
    states: set[str]
    alphabet: set[str]
    start: str
    finals: set[str]
    transitions: dict

@router.post("/nfa_to_dfa")
def convert_nfa(defn: NFADef):
    nfa = NFA(
        states=set(defn.states),
        alphabet=set(defn.alphabet),
        start=defn.start,
        finals=set(defn.finals),
        transitions={s: {a: set(t) for a, t in ad.items()} for s, ad in defn.transitions.items()},
    )
    dfa: DFA = nfa_to_dfa(nfa)
    def setname(S): return "{" + ",".join(sorted(S)) + "}"
    return {
        "states": [setname(s) for s in dfa.states],
        "alphabet": sorted(dfa.alphabet),
        "start": setname(dfa.start),
        "finals": [setname(s) for s in dfa.finals],
        "transitions": {setname(s): {a: setname(t) for a, t in trans.items()} for s, trans in dfa.transitions.items()},
    }


#-- DAFSA visualization as DOT --
def _dafsa_to_dot(root: Node) -> str:
    # Left-to-right graph
    lines = ['digraph DAFSA {', 'rankdir=LR;']
    seen = {}
    counter = 0

    def nid(n: Node) -> str:
        nonlocal counter
        if id(n) not in seen:
            seen[id(n)] = f"n{counter}"
            counter += 1
        return seen[id(n)]

    # DFS
    stack = [root]
    visited = set()
    while stack:
        n = stack.pop()
        if id(n) in visited:
            continue
        visited.add(id(n))
        u = nid(n)
        # node shape
        shape = "doublecircle" if n.final else "circle"
        label = "•" if n.final else ""
        lines.append(f'{u} [shape={shape}, label="{label}"];')
        # edges
        for a, c in n.edges.items():
            v = nid(c)
            # escape quotes in labels just in case
            a2 = a.replace('"', '\\"')
            lines.append(f'{u} -> {v} [label="{a2}"];')
            stack.append(c)

    lines.append('}')
    return "\n".join(lines)

@router.get("/dafsa/dot")
def dafsa_dot():
    dot = _dafsa_to_dot(dafsa.root)
    return Response(content=dot, media_type="text/plain")
