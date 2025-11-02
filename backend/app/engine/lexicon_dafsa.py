from dataclasses import dataclass
from typing import Dict, List, Set
from .dafsa import DAFSA

@dataclass
class LexMatch:
    found: Set[str]           # matched lexeme keys
    hints: Set[str]           # mapped hint tags

class LexiconDAFSA:
    """
    Keeps a DAFSA of lexemes (words) and a mapping word->hint tags.
    e.g., {"traffic":["traffic"], "next":["advance","timer"], "elevator":["elevator"], "up":["up"]}
    """
    def __init__(self):
        self.dafsa = DAFSA()
        self.map: Dict[str, Set[str]] = {}

    def load(self, lexmap: Dict[str, List[str]]) -> None:
        self.dafsa = DAFSA()
        self.map = {k.lower(): set(v) for k,v in lexmap.items()}
        for word in sorted(self.map.keys()):
            self.dafsa.add(word)
        # if you added minimize(), call it:
        if hasattr(self.dafsa, "minimize"):
            self.dafsa.minimize()

    def query(self, text: str) -> LexMatch:
        found, hints = set(), set()
        for tok in text.lower().split():
            if self.dafsa.search(tok):
                found.add(tok)
                hints |= self.map.get(tok, set())
        return LexMatch(found=found, hints=hints)
