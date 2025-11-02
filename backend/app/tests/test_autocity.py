from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    assert client.get("/api/health").json()["status"] == "ok"

def test_dafsa_build_and_search():
    words = ["aa","aab","aaab","aba","abab","ba","baab","bab","bba","bbab"]
    r = client.post("/api/automata/dafsa/build", json=words)
    assert r.status_code == 200
    # sanity: it built all words
    for w in words:
        assert client.post("/api/automata/dafsa/search", json={"word": w}).json()["exists"] is True
    # negative checks
    for w in ["", "a", "bb", "abba", "baa"]:
        assert client.post("/api/automata/dafsa/search", json={"word": w}).json()["exists"] is False

def test_nfa_to_dfa_simple():
    payload = {
        "states": ["q0","q1","qf"],
        "alphabet": ["a","b"],
        "start": "q0",
        "finals": ["qf"],
        "transitions": {
            "q0": {"a": ["q1"]},
            "q1": {"b": ["qf"]},
            "qf": {}
        }
    }
    r = client.post("/api/automata/nfa_to_dfa", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "{q0}" in data["states"]
    assert "{qf}" in data["states"]

def test_fsms():
    r = client.get("/api/fsm/traffic").json()
    assert r["state"] in {"RED","GREEN","YELLOW"}
    r = client.post("/api/fsm/traffic", json={"event":"timer"}); assert r.status_code == 200

    r = client.post("/api/fsm/elevator", json={"event":"call_up"}); assert r.status_code == 200
    r = client.post("/api/fsm/elevator", json={"event":"arrive"}); assert r.status_code == 200
    r = client.post("/api/fsm/elevator", json={"event":"close"}); assert r.status_code == 200

    r = client.post("/api/fsm/vending", json={"event":"coin_2"}); assert r.status_code == 200
    r = client.post("/api/fsm/vending", json={"event":"coin_3"}); assert r.status_code == 200
    r = client.post("/api/fsm/vending", json={"event":"select"}); assert r.status_code == 200
