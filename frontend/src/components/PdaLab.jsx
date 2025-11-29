import React, { useMemo, useState } from "react";
import { api } from "../api"; // not used but safe for future reuse

// Simple deterministic PDA demo: balanced parentheses or a^n b^n.
// Pure frontend

const SAMPLE_PARENS_OK = "(()())";
const SAMPLE_PARENS_BAD = "())(";
const SAMPLE_ANBN_OK = "aaabbb";
const SAMPLE_ANBN_BAD = "aab";

const STATUS = {
  idle: "Idle",
  running: "Running",
  accepted: "Accepted",
  rejected: "Rejected",
};

function badgeClass(status) {
  if (status === "accepted") return "pill success";
  if (status === "rejected") return "pill error";
  if (status === "running") return "pill";
  return "pill muted";
}

function initialConfig(input, mode) {
  return {
    input,
    pos: 0,
    stack: ["Z"], // Z = stack bottom marker
    state: "q0",
    status: "idle",
    steps: [],
    mode,
    seenA: false,
    seenB: false,
  };
}

function stepPDA(cfg) {
  if (cfg.status === "accepted" || cfg.status === "rejected") return cfg;

  const ch = cfg.pos < cfg.input.length ? cfg.input[cfg.pos] : null;
  const top = cfg.stack[cfg.stack.length - 1];
  let { pos, stack, state, seenA, seenB } = cfg;
  let status = "running";
  let note = "";

  if (cfg.mode === "parens") {
    if (ch === "(") {
      stack = [...stack, "("];
      pos += 1;
      note = "push '('";
    } else if (ch === ")" && top === "(") {
      stack = stack.slice(0, -1);
      pos += 1;
      note = "pop '('";
    } else if (ch === null) {
      // end of input
      if (stack.length === 1 && stack[0] === "Z") {
        status = "accepted";
        note = "empty stack -> accept";
      } else {
        status = "rejected";
        note = "leftover '(' on stack";
      }
    } else {
      status = "rejected";
      note = "mismatched ')'";
    }
  } else {
    // mode: anbn
    if (ch === "a" && !seenB) {
      stack = [...stack, "A"];
      pos += 1;
      seenA = true;
      note = "push A";
    } else if (ch === "b" && stack.length > 1) {
      stack = stack.slice(0, -1);
      pos += 1;
      seenB = true;
      note = "pop A";
      if (!seenA) status = "rejected"; // cannot see b before a
    } else if (ch === null) {
      if (stack.length === 1 && stack[0] === "Z" && seenA && seenB) {
        status = "accepted";
        note = "stack empty + seen a/b";
      } else {
        status = "rejected";
        note = "stack not empty or missing a/b";
      }
    } else {
      status = "rejected";
      note = "invalid symbol or underflow";
    }
  }

  const next = {
    ...cfg,
    pos,
    stack,
    state,
    seenA,
    seenB,
    status,
    steps: [...cfg.steps, { pos, stack, state, note, ch: ch ?? "ε" }],
  };

  return next;
}

function runPDA(cfg, limit = 512) {
  let cur = { ...cfg, status: cfg.status === "idle" ? "running" : cfg.status };
  for (let i = 0; i < limit; i++) {
    const next = stepPDA(cur);
    if (next === cur) break;
    cur = next;
    if (cur.status === "accepted" || cur.status === "rejected") break;
  }
  return cur;
}

function StackView({ stack }) {
  const rendered = stack.length ? [...stack].reverse() : [];
  return (
    <div className="row gap wrap" style={{ alignItems: "flex-end" }}>
      {rendered.map((s, i) => (
        <span key={i} className="pill mono">{s}</span>
      ))}
    </div>
  );
}

function InputTape({ input, pos }) {
  return (
    <div className="row gap wrap" style={{ alignItems: "center", fontFamily: "monospace" }}>
      {input.split("").map((c, i) => (
        <div
          key={i}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: i === pos ? "var(--panel)" : "transparent",
            color: "var(--text)",
          }}
        >
          {c}
        </div>
      ))}
      {pos >= input.length && (
        <div style={{ padding: "6px 10px", borderRadius: 8, border: "1px dashed var(--border)" }}>ε</div>
      )}
    </div>
  );
}

export default function PdaLab() {
  const [mode, setMode] = useState("parens");
  const [input, setInput] = useState(SAMPLE_PARENS_OK);
  const [cfg, setCfg] = useState(() => initialConfig(SAMPLE_PARENS_OK, "parens"));

  const reset = (txt = input, m = mode) => setCfg(initialConfig(txt, m));

  const onModeChange = (m) => {
    setMode(m);
    const sample = m === "parens" ? SAMPLE_PARENS_OK : SAMPLE_ANBN_OK;
    setInput(sample);
    reset(sample, m);
  };

  const statusLabel = STATUS[cfg.status] || cfg.status;

  const summary = useMemo(() => {
    if (cfg.mode === "parens") return "Accepts balanced parentheses using a stack (push '(' / pop ')').";
    return "Accepts a^n b^n by pushing for each 'a' then popping for each 'b'.";
  }, [cfg.mode]);

  return (
    <div className="card">
      <div className="row items-center space-between">
        <h3 className="muted">PDA Lab (Balanced Parens / a^n b^n)</h3>
        <div className="row gap-s">
          <button className="pill" onClick={() => onModeChange("parens")} disabled={mode === "parens"}>Parens</button>
          <button className="pill" onClick={() => onModeChange("anbn")} disabled={mode === "anbn"}>a^n b^n</button>
        </div>
      </div>

      <small className="muted">{summary}</small>

      <div className="row gap" style={{ marginTop: 12 }}>
        <textarea
          value={input}
          onChange={e => { setInput(e.target.value); reset(e.target.value); }}
          rows={3}
          spellCheck={false}
          style={{ width: "100%" }}
        />
        <div className="col gap-s" style={{ flex: "0 0 180px" }}>
          <button className="pill" onClick={() => { const s = mode === "parens" ? SAMPLE_PARENS_OK : SAMPLE_ANBN_OK; setInput(s); reset(s); }}>Load Sample ✓</button>
          <button className="pill" onClick={() => { const s = mode === "parens" ? SAMPLE_PARENS_BAD : SAMPLE_ANBN_BAD; setInput(s); reset(s); }}>Load Sample ✗</button>
          <button className="pill" onClick={() => reset()}>Reset</button>
        </div>
      </div>

      <div className="row gap-s" style={{ marginTop: 12 }}>
        <button className="primary" onClick={() => setCfg(runPDA(cfg))} disabled={cfg.status === "accepted" || cfg.status === "rejected"}>Run</button>
        <button className="secondary" onClick={() => setCfg(stepPDA({ ...cfg, status: cfg.status === "idle" ? "running" : cfg.status }))} disabled={cfg.status === "accepted" || cfg.status === "rejected"}>Step</button>
        <span className={badgeClass(cfg.status)}>{statusLabel}</span>
        <span className="pill">State: {cfg.state}</span>
        <span className="pill">Pos: {cfg.pos}/{cfg.input.length}</span>
        <span className="pill">Stack size: {cfg.stack.length}</span>
      </div>

      <div className="col gap" style={{ marginTop: 16 }}>
        <div>
          <div className="muted">Input</div>
          <InputTape input={cfg.input} pos={cfg.pos} />
        </div>

        <div>
          <div className="muted">Stack (top on right)</div>
          <StackView stack={cfg.stack} />
        </div>

        <div>
          <div className="muted">Steps</div>
          <div className="chatbox" style={{ maxHeight: 200, overflowY: "auto" }}>
            {cfg.steps.map((s, i) => (
              <div key={i} className="bubble system">
                <div className="bubble-text mono">
                  [{i+1}] read {s.ch} | pos {s.pos} | stack [{s.stack.join(",")}] | {s.note}
                </div>
              </div>
            ))}
            {cfg.steps.length === 0 && <div className="muted">No steps yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
