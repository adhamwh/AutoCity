from dataclasses import dataclass
from typing import Dict, List, Set
from .nfa_to_dfa import NFA, nfa_to_dfa

@dataclass
class CompiledPattern:
    name: str
    dfa: object
    alphabet: Set[str]

def compile_contains_sequence(name: str, alternatives: List[Set[str]]) -> CompiledPattern:
    """
    Build an NFA that accepts any token stream which contains, in order,
    one token from each OR-set in `alternatives`.

    Example:
        [{"traffic"}, {"next","timer","advance"}]
    means: somewhere a token 'traffic', later a token in {'next','timer','advance'}.
    """
    n = len(alternatives)
    states = [f"q{i}" for i in range(n + 1)]
    start = states[0]
    finals = {states[-1]}

    # Alphabet is the union of all tokens mentioned
    alphabet: Set[str] = set()
    for s in alternatives:
        alphabet |= set(s)

    # transitions: state -> symbol -> set(next_states)
    transitions: Dict[str, Dict[str, Set[str]]] = {s: {} for s in states}

    # For each stage i: stay on any token (self-loop), advance on a token in alternatives[i]
    for i in range(n):
        cur = states[i]
        nxt = states[i + 1]
        req = alternatives[i]

        # self-loops on alphabet (skip tokens)
        for tok in alphabet:
            transitions[cur].setdefault(tok, set()).add(cur)

        # advance on required tokens
        for tok in req:
            transitions[cur].setdefault(tok, set()).add(nxt)

    # Accepting state: self-loops on alphabet (once accepted, remain accepted)
    acc = states[-1]
    for tok in alphabet:
        transitions[acc].setdefault(tok, set()).add(acc)

    nfa = NFA(
        states=set(states),
        alphabet=set(alphabet),
        start=start,
        finals=set(finals),
        transitions=transitions,
    )
    dfa = nfa_to_dfa(nfa)
    return CompiledPattern(name=name, dfa=dfa, alphabet=alphabet)

def dfa_accepts(dfa, tokens: List[str]) -> bool:
    """
    Run tokens through the DFA. Tokens not in the DFA's alphabet are ignored.
    """
    cur = dfa.start
    for tok in tokens:
        if tok not in dfa.alphabet:
            continue
        nxt = dfa.transitions.get(cur, {}).get(tok)
        if nxt is None:
            # no transition on this token: ignore it
            continue
        cur = nxt
    return cur in dfa.finals
