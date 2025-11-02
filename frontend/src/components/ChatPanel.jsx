// src/components/ChatPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";

const LS_CHAT = "autocity_chat_v1";
const LS_LEX  = "autocity_lexicon_v1";

const DEFAULT_LEXMAP = {
  traffic: ["traffic"],
  next: ["traffic_next", "next", "timer", "advance"],
  elevator: ["elevator", "lift", "floor"],
  up: ["elevator_up", "up"],
  down: ["elevator_down", "down"],
  coin: ["vending_coin", "coin", "insert"],
  select: ["vending_select", "select", "buy"],
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default function ChatPanel() {
  const [msgs, setMsgs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_CHAT) || "[]"); }
    catch { return []; }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  // Lexicon manager
  const [lexText, setLexText] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_LEX);
      return saved ? saved : JSON.stringify(DEFAULT_LEXMAP, null, 2);
    } catch {
      return JSON.stringify(DEFAULT_LEXMAP, null, 2);
    }
  });
  const [lexOk, setLexOk] = useState(true);
  const [lexMsg, setLexMsg] = useState("");

  // Debug
  const [debugOn, setDebugOn] = useState(false);
  const [lastDebug, setLastDebug] = useState(null);

  // Auto-scroll + persist chat
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => { localStorage.setItem(LS_CHAT, JSON.stringify(msgs.slice(-50))); }, [msgs]);

  const push = (role, text, extra={}) => setMsgs(m => [...m, { role, text, ts: Date.now(), ...extra }]);
  const pushSystem = (text) => push("system", text);

  // Lex JSON validation
  const parsedLex = useMemo(() => {
    try {
      const j = JSON.parse(lexText);
      setLexOk(true); setLexMsg("");
      return j;
    } catch (e) {
      setLexOk(false);
      setLexMsg(e.message || "Invalid JSON");
      return null;
    }
  }, [lexText]);

  const refreshCity = () => {
    window.dispatchEvent(new CustomEvent("autocity:refresh"));
  };

  // Intent to API function map
  const INTENT_MAP = {
    traffic_next: async (_arg, suppress) => {
      await api.trafficEvent("timer");
      if (!suppress) push("assistant", "Traffic advanced");
    },
    elevator_up: async (_arg, suppress) => {
      await api.elevatorEvent("call_up");
      await api.elevatorEvent("arrive");
      if (!suppress) push("assistant", "Elevator moved up");
    },
    elevator_down: async (_arg, suppress) => {
      await api.elevatorEvent("call_down");
      await api.elevatorEvent("arrive");
      if (!suppress) push("assistant", "Elevator moved down");
    },
    vending_coin: async (n=1, suppress) => {
      await api.vendingEvent(`coin_${n}`);
      if (!suppress) push("assistant", `Inserted coin ${n} ✅`);
    },
    vending_select: async (_arg, suppress) => {
      await api.vendingEvent("select");
      if (!suppress) push("assistant", "Selected item ✅");
    },
  };

  // Apply intent (backend or manual)
  const applyIntent = async (intent, arg, { suppressMessage = false } = {}) => {
    if (!intent) return false;
    const fn = INTENT_MAP[intent];
    if (!fn) return false;
    await fn(arg, suppressMessage);
    refreshCity();
    return true;
  };

  // Fallback for raw text
  const applyFallbackFromText = async (raw) => {
    const T = (raw || "").toLowerCase();
    if (T.includes("traffic") && (T.includes("next") || T.includes("advance") || T.includes("timer"))) {
      await INTENT_MAP.traffic_next?.();
      refreshCity();
      return true;
    }
    if (T.includes("elevator") || T.includes("lift")) {
      if (T.includes("up")) { await INTENT_MAP.elevator_up?.(); refreshCity(); return true; }
      if (T.includes("down")) { await INTENT_MAP.elevator_down?.(); refreshCity(); return true; }
    }
    if (T.includes("coin")) {
      const n = T.match(/\bcoin\s*(\d+)/)?.[1] || T.match(/\b(\d+)\s*coin/)?.[1] || 1;
      await INTENT_MAP.vending_coin?.(n);
      refreshCity();
      return true;
    }
    if (T.includes("select") || T.includes("buy")) {
      await INTENT_MAP.vending_select?.();
      refreshCity();
      return true;
    }
    return false;
  };

  // Send flow
  const send = async (text) => {
    if (!text?.trim() || busy) return;
    setError("");
    setBusy(true);
    push("user", text);

    try {
      await sleep(120);
      const res = await api.chat(text);

      const replyText =
        typeof res === "string" ? res :
        res?.reply ?? "";
      if (replyText) push("assistant", replyText);

      let handled = await applyIntent(res?.intent, res?.arg, { suppressMessage: !!replyText });
      setLastDebug({ intent: res?.intent, arg: res?.arg, hints: res?.hints });

      if (!handled) await applyFallbackFromText(text);
    } catch (e) {
      const msg = e?.message || String(e);
      setError(msg);
      push("system", `Error: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
      setInput("");
    }
  };

  // Quick actions
  const qa = [
    { label: "Traffic → Next", msg: "please advance the traffic light" },
    { label: "Elevator ↑", msg: "call the elevator up" },
    { label: "Elevator ↓", msg: "call the elevator down" },
    { label: "Coin 2", msg: "insert coin 2" },
    { label: "Select", msg: "select item" },
  ];

  // Lexicon ops
  const loadLexicon = async () => {
    if (!parsedLex) { setLexMsg("Fix JSON before loading."); setLexOk(false); return; }
    try {
      const r = await api.loadLex(parsedLex);
      localStorage.setItem(LS_LEX, lexText);
      pushSystem(`Lexicon loaded (${r?.loaded ?? "?"}) ✅`);
    } catch (e) {
      pushSystem("Lexicon load failed ❌ " + (e?.message || e));
    }
  };

  const restoreDefaultLex = () => {
    const txt = JSON.stringify(DEFAULT_LEXMAP, null, 2);
    setLexText(txt);
    setLexOk(true); setLexMsg("");
  };

  const copyChat = async () => {
    try {
      const t = msgs.map(m => `[${new Date(m.ts).toLocaleTimeString()}] ${m.role}: ${m.text}`).join("\n");
      await navigator.clipboard.writeText(t || "");
      pushSystem("Copied transcript to clipboard ✅");
    } catch { pushSystem("Copy failed ❌"); }
  };

  return (
    <div className="card">
      <div className="row gap">
        {/* Left: Lexicon */}
        <div className="col" style={{flex: "0 0 420px"}}>
          <div className="row items-center space-between">
            <h3 className="muted">Lexicon (DAFSA-backed)</h3>
            <div className="row gap-s">
              <button className="pill" onClick={restoreDefaultLex}>Restore Default</button>
              <button className="pill" onClick={loadLexicon} disabled={!lexOk}>Load Lexicon</button>
            </div>
          </div>
          <textarea
            value={lexText}
            onChange={e => setLexText(e.target.value)}
            rows={12}
            className={!lexOk ? "error" : ""}
            spellCheck={false}
          />
          {!lexOk && <small className="error">{lexMsg}</small>}
        </div>

        {/* Right: Conversation */}
        <div className="col">
          <div className="row items-center space-between">
            <h3 className="muted">Conversation</h3>
            <div className="row gap-s">
              <button className="pill" onClick={() => setMsgs([])}>Clear</button>
              <button className="pill" onClick={copyChat}>Copy</button>
              <button className="pill" onClick={() => setDebugOn(v => !v)}>{debugOn ? "Debug: On" : "Debug: Off"}</button>
            </div>
          </div>

          <div className="chatbox">
            {msgs.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                <div className="bubble-text">{m.text}</div>
              </div>
            ))}
            {busy && (
              <div className="bubble assistant">
                <div className="typing">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            )}
            {!!error && <div className="chip error">Network error — {error}</div>}
            {debugOn && lastDebug && (
              <div className="debug">
                <span>intent: <b>{String(lastDebug.intent || "–")}</b></span>
                <span>arg: <b>{String(lastDebug.arg || "–")}</b></span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick actions */}
          <div className="row gap wrap" style={{marginTop: 8}}>
            {qa.map(q => (
              <button
                key={q.label}
                className="pill"
                disabled={busy}
                onClick={() => { setInput(""); send(q.msg); }}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Composer */}
          <div className="row gap" style={{marginTop: 12}}>
            <input
              className="grow"
              placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              className="primary"
              onClick={() => { send(input); setInput(""); }}
              disabled={busy || !input.trim()}
            >
              {busy ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
