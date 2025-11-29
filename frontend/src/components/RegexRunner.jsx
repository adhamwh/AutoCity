import React, { useEffect, useMemo, useRef, useState } from "react";

// Regex Runner mini-game (frontend-only, non-invasive)
// Words arrive; player must accept/reject based on regex membership.

const ALPHABET = "abcdeftlrnox"; // small set to keep words readable

function randWord() {
  const len = 3 + Math.floor(Math.random() * 4);
  let s = "";
  for (let i = 0; i < len; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

function compileRegex(src) {
  try {
    const re = new RegExp(src);
    return { ok: true, re };
  } catch (e) {
    return { ok: false, error: e?.message || "Invalid regex" };
  }
}

function wordPath(word) {
  // simple positional "states" for educational flavor
  const states = [];
  for (let i = 0; i < word.length; i++) {
    states.push(`q${i} --${word[i]}--> q${i + 1}`);
  }
  states.push(`q${word.length} --ε--> q${word.length}`);
  return states;
}

export default function RegexRunner() {
  const [regex, setRegex] = useState("^(tra(ff)?ic|car)$");
  const [queue, setQueue] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState("idle"); // idle|running|over
  const [log, setLog] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const spawnRef = useRef(null);
  const tickRef = useRef(null);

  const compiled = useMemo(() => compileRegex(regex), [regex]);

  const reset = () => {
    setQueue([]);
    setScore(0);
    setLives(3);
    setLog([]);
    setStatus("idle");
  };

  const start = () => {
    if (!compiled.ok) return;
    setQueue([]);
    setScore(0);
    setLives(3);
    setLog([]);
    setStatus("running");
  };

  const stop = () => {
    setStatus("over");
    clearInterval(spawnRef.current);
    clearInterval(tickRef.current);
  };

  // Spawn words periodically while running
  useEffect(() => {
    clearInterval(spawnRef.current);
    if (status !== "running") return;
    spawnRef.current = setInterval(() => {
      setQueue((q) => {
        if (q.length > 10) return q; // cap queue
        return [...q, { id: crypto.randomUUID(), word: randWord(), ts: Date.now() }];
      });
    }, 1800);
    return () => clearInterval(spawnRef.current);
  }, [status]);

  // Expire words if not handled
  useEffect(() => {
    clearInterval(tickRef.current);
    if (status !== "running") return;
    tickRef.current = setInterval(() => {
      setQueue((q) => {
        const now = Date.now();
        const kept = [];
        let lost = 0;
        for (const w of q) {
          if (now - w.ts > 7000) {
            lost += 1;
          } else {
            kept.push(w);
          }
        }
        if (lost) setLives((l) => Math.max(0, l - lost));
        return kept;
      });
    }, 500);
    return () => clearInterval(tickRef.current);
  }, [status]);

  // End game when lives run out
  useEffect(() => {
    if (lives <= 0 && status === "running") {
      stop();
    }
  }, [lives, status]);

  const resolveWord = (id, decision) => {
    if (!compiled.ok) return;
    setQueue((q) => {
      const w = q.find((x) => x.id === id);
      if (!w) return q;
      const accepted = compiled.re.test(w.word);
      const correct = (decision === "accept" && accepted) || (decision === "reject" && !accepted);
      setScore((s) => s + (correct ? 10 : -5));
      if (!correct) setLives((l) => Math.max(0, l - 1));
      setLog((log) => [
        {
          id,
          word: w.word,
          decision,
          accepted,
          correct,
          path: wordPath(w.word),
          ts: Date.now(),
        },
        ...log,
      ].slice(0, 40));
      return q.filter((x) => x.id !== id);
    });
  };

  return (
    <div className="card">
      <div className="row items-center space-between">
        <h3 className="muted">Regex Runner</h3>
        <div className="row gap-s">
          <span className="pill">Score: {score}</span>
          <span className="pill">Lives: {lives}</span>
          <span className="pill">{status === "running" ? "Running" : status === "over" ? "Game Over" : "Idle"}</span>
          <button className="pill" onClick={() => setShowHelp(true)}>How to Play?</button>
          <button className="pill" onClick={() => setShowExplain(true)}>How Does This Work?</button>
        </div>
      </div>

      <div className="row gap" style={{ marginTop: 12 }}>
        <input
          className="grow mono"
          value={regex}
          onChange={(e) => setRegex(e.target.value)}
          placeholder="Enter regex (JS syntax)"
        />
        <button className="primary" onClick={start} disabled={!compiled.ok}>Start</button>
        <button className="secondary" onClick={reset}>Reset</button>
      </div>
      {!compiled.ok && <small className="error">Regex error: {compiled.error}</small>}

      <div className="row gap wrap" style={{ marginTop: 12 }}>
        <span className="pill mono">Alphabet: {ALPHABET}</span>
        <small className="muted">Accept/reject words before they expire (7s). Correct choice: +10, wrong: -5 & lose 1 life.</small>
      </div>

      <div className="col gap" style={{ marginTop: 16 }}>
        <div>
          <div className="muted">Queue</div>
          <div className="row gap wrap">
            {queue.length === 0 && <div className="muted">No words in queue.</div>}
            {queue.map((w) => (
              <div key={w.id} className="bubble user" style={{ minWidth: 140 }}>
                <div className="bubble-text mono">{w.word}</div>
                <div className="row gap-s" style={{ marginTop: 6 }}>
                  <button className="pill" onClick={() => resolveWord(w.id, "accept")}>Accept</button>
                  <button className="pill" onClick={() => resolveWord(w.id, "reject")}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="muted">Recent results</div>
          <div className="chatbox" style={{ maxHeight: 220, overflowY: "auto" }}>
            {log.length === 0 && <div className="muted">No results yet.</div>}
            {log.map((r) => (
              <div key={r.id} className={`bubble ${r.correct ? "assistant" : "system"}`}>
                <div className="bubble-text mono">
                  {r.word} — you chose {r.decision}, regex {r.accepted ? "accepted" : "rejected"} → {r.correct ? "✔" : "✖"}
                  <div className="muted" style={{ marginTop: 4 }}>
                    {r.path.join(" · ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showHelp && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}>
          <div className="card" style={{ maxWidth: 520, width: "100%", position: "relative" }}>
            <button
              className="pill"
              style={{ position: "absolute", top: 12, right: 12 }}
              onClick={() => setShowHelp(false)}
            >
              Close
            </button>
            <h3 className="muted">How to Play</h3>
            <ol className="mono" style={{ lineHeight: 1.6, paddingLeft: 18 }}>
              <li>Enter a regex (pattern) like <code>^car$</code> or <code>^tra(ff)?ic$</code> and click Start.</li>
              <li>Words appear in the queue. Click <b>Accept</b> if the word matches your regex; <b>Reject</b> if it doesn&apos;t.</li>
              <li>Ignore a word for ~7s and you lose a life.</li>
              <li>Scoring: correct = +10, wrong = -5 and -1 life. Lose all lives → game over.</li>
              <li>The “Recent results” line shows whether your regex accepted the word and a simple state path; you can ignore it to just play.</li>
            </ol>
            <div style={{ marginTop: 12 }}>
              <div className="muted">Quick regex examples</div>
              <ul className="mono" style={{ paddingLeft: 18, lineHeight: 1.5 }}>
                <li><code>car</code> matches any string containing “car”.</li>
                <li><code>^car$</code> matches exactly “car”.</li>
                <li><code>^tra(ff)?ic$</code> matches “traic” or “traffic”.</li>
                <li><code>^a+b*$</code> matches one or more “a” followed by zero or more “b”.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {showExplain && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}>
          <div className="card" style={{ maxWidth: 520, width: "100%", position: "relative" }}>
            <button
              className="pill"
              style={{ position: "absolute", top: 12, right: 12 }}
              onClick={() => setShowExplain(false)}
            >
              Close
            </button>
            <h3 className="muted">How Does This Work?</h3>
            <div className="mono" style={{ lineHeight: 1.6 }}>
              <p>This mini-game is a live language membership test. You enter a regex, which defines a regular language (L).</p>
              <p>Each word in the queue is a candidate string. Clicking Accept/Reject is saying “w ∈ L” or “w ∉ L.” The game checks your decision by running the regex on the word.</p>
              <p>The “state path” text shows a simple DFA-like walk for the characters in the word (q0 --x--> q1 ...), echoing how finite automata consume input symbols.</p>
              <p>Core ToC ideas: regular languages, membership testing, DFA-style state progression, and acceptance/rejection. Your score reflects how accurately you classify strings against the language defined by your regex.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
