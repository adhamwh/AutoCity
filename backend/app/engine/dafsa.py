from dataclasses import dataclass, field
from typing import Dict, Tuple

@dataclass(eq=False)
class Node:
    edges: Dict[str, "Node"] = field(default_factory=dict)
    final: bool = False

class DAFSA:
    """
    Trie + bottom-up minimization:
      - add(word): inserts path
      - minimize(): merges equivalent suffix states by signature (final flag + labeled outgoing edges)
      - search(word): works on raw or minimized structure
    """
    def __init__(self):
        self.root = Node()

    # -- basic ops --
    def add(self, word: str) -> None:
        cur = self.root
        for ch in word:
            cur = cur.edges.setdefault(ch, Node())
        cur.final = True

    def search(self, word: str) -> bool:
        cur = self.root
        for ch in word:
            if ch not in cur.edges:
                return False
            cur = cur.edges[ch]
        return cur.final

    def num_states(self) -> int:
        seen = set()
        def dfs(n: Node):
            if id(n) in seen: return 0
            seen.add(id(n))
            return 1 + sum(dfs(c) for c in n.edges.values())
        return dfs(self.root)

    # -- minimization --
    def minimize(self) -> None:
        """
        Bottom-up: compute a canonical signature for each node and intern identical ones.
        Signature = (final, sorted[(label, child_id_signature)]). We compute child signatures first.
        """
        intern: Dict[Tuple, Node] = {}

        def canonicalize(n: Node) -> Node:
            # canonicalize children first
            if not n.edges:
                sig = (n.final, ())
            else:
                canon_children = []
                for a, child in n.edges.items():
                    cc = canonicalize(child)
                    canon_children.append((a, cc))
                # reattach canonicalized children by label
                n.edges = {a: c for a, c in canon_children}
                # build signature
                child_sig = tuple(sorted((a, id(c)) for a, c in n.edges.items()))
                sig = (n.final, child_sig)

            # intern by signature
            if sig in intern:
                return intern[sig]
            intern[sig] = n
            return n

        self.root = canonicalize(self.root)
