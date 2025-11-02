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

// tiny helper
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default function ChatPanel() {
  // conversation
  const [msgs, setMsgs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_CHAT) || "[]"); }
    catch { return []; }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  // lexicon manager
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

  // debug panel
  const [debugOn, setDebugOn] = useState(false);
  const [lastDebug, setLastDebug] = useState(null); // {intent,arg,hints?}

  // auto-scroll
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // persist chat minimal
  useEffect(() => { localStorage.setItem(LS_CHAT, JSON.stringify(msgs.slice(-50))); }, [msgs]);

  // simple push helpers
  const push = (role, text, extra={}) => setMsgs(m => [...m, { role, text, ts: Date.now(), ...extra }]);
  const pushSystem = (text) => push("system", text);

  // validate lex JSON without throwing
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

  // send flow
  const send = async (text) => {
    if (!text?.trim() || busy) return;
    setError("");
    setBusy(true);
    push("user", text);

    try {
      // little typing delay so UI feels alive
      await sleep(120);

      // include lexicon hints on server side by loading first? We keep it as a separate action.
      const res = await api.chat({ message: text });
      // res may be object/string — make robust
      const replyText =
        typeof res === "string" ? res :
        res?.reply ?? JSON.stringify(res);

      push("assistant", replyText);
      // capture lightweight debug
      setLastDebug({ intent: res?.intent, arg: res?.arg, hints: res?.hints });
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

  // quick actions
  const qa = [
    { label: "Traffic → Next", msg: "please advance the traffic light" },
    { label: "Elevator ↑", msg: "call the elevator up" },
    { label: "Elevator ↓", msg: "call the elevator down" },
    { label: "Coin 2", msg: "insert coin 2" },
    { label: "Select", msg: "select item" },
  ];

  // lexicon ops
  const loadLexicon = async () => {
    if (!parsedLex) { setLexMsg("Fix JSON before loading."); setLexOk(false); return; }
    try {
      const r = await api.chat_lexicon_load({ lexmap: parsedLex });
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
        {/* Left: Lexicon Manager */}
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

            {!!error && (
              <div className="chip error">Network error — {error}</div>
            )}

            {debugOn && lastDebug && (
              <div className="debug">
                <span>intent: <b>{String(lastDebug.intent || "–")}</b></span>
                <span>arg: <b>{String(lastDebug.arg || "–")}</b></span>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* quick actions */}
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

          {/* composer */}
          <div className="row gap" style={{marginTop: 12}}>
            <input
              className="grow"
              placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button className="primary" onClick={() => { send(input); setInput(""); }} disabled={busy || !input.trim()}>
              {busy ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
