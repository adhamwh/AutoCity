import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";

/* ------------------ constants ------------------ */

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

/* =============================================================== */

export default function ChatPanel() {
  /* conversation ------------------------------------------------- */
  const [msgs, setMsgs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_CHAT) || "[]"); }
    catch { return []; }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const chatBoxRef = useRef(null);

  /* lexicon ------------------------------------------------------ */
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

  /* debug -------------------------------------------------------- */
  const [debugOn, setDebugOn] = useState(false);
  const [lastDebug, setLastDebug] = useState(null);  // { intent, arg, hints? }

  /* effects ------------------------------------------------------ */
  useEffect(() => {
    const box = chatBoxRef.current;
    if (!box) return;
    box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [msgs]);
  useEffect(() => { localStorage.setItem(LS_CHAT, JSON.stringify(msgs.slice(-50))); }, [msgs]);

  /* helpers ------------------------------------------------------ */
  const push = (role, text, extra = {}) => setMsgs(m => [...m, { role, text, ts: Date.now(), ...extra }]);
  const pushSystem = (text) => push("system", text);
  const notifyRefresh = () => {
    // Trigger both the direct hook and the custom event used by CityPanel
    try { window.__autocity_refresh?.(); } catch (_) {}
    try { window.dispatchEvent(new Event("autocity:refresh")); } catch (_) {}
  };

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

  /* ------------- intent map (actions) ------------- */
  // Each action accepts (arg, suppressMessage=false)
  const INTENT_MAP = {
    async traffic_next(_arg, suppress=false) {
      await api.trafficEvent("timer");
      if (!suppress) push("assistant", "Traffic advanced");
      notifyRefresh();
    },
    async elevator_up(_arg, suppress=false) {
      await api.elevatorEvent("call_up");
      await api.elevatorEvent("arrive");
      if (!suppress) push("assistant", "Elevator moved up");
      notifyRefresh();
    },
    async elevator_down(_arg, suppress=false) {
      await api.elevatorEvent("call_down");
      await api.elevatorEvent("arrive");
      if (!suppress) push("assistant", "Elevator moved down");
      notifyRefresh();
    },
    async vending_coin(arg = "2", suppress=false) {
      const n = String(arg || "2").trim();
      await api.vendingEvent(`coin_${n}`);
      if (!suppress) push("assistant", `Inserted coin ${n} ✅`);
      notifyRefresh();
    },
    async vending_select(_arg, suppress=false) {
      await api.vendingEvent("select");
      if (!suppress) push("assistant", "Selected item ✅");
      notifyRefresh();
    },
  };

  // Execute an intent coming from the server
  const applyIntent = async (intent, arg, { suppressMessage = false } = {}) => {
    const fn = intent && INTENT_MAP[intent];
    if (!fn) return false;
    await fn(arg, suppressMessage);
    return true;
  };

  // Fallback: infer action from user text if server didn’t give an intent.
  // NEW: `suppress` prevents adding another assistant bubble when server already replied.
  const applyFallbackFromText = async (raw, { suppress = true } = {}) => {
    const T = (raw || "").toLowerCase();

    if (T.includes("traffic") && (T.includes("next") || T.includes("advance") || T.includes("timer"))) {
      await INTENT_MAP.traffic_next?.(undefined, suppress);
      return true;
    }

    if (T.includes("elevator") || T.includes("lift")) {
      if (T.includes("up")) {
        await INTENT_MAP.elevator_up?.(undefined, suppress);
        return true;
      }
      if (T.includes("down")) {
        await INTENT_MAP.elevator_down?.(undefined, suppress);
        return true;
      }
    }

    if (T.includes("coin")) {
      const n = T.match(/\bcoin\s*(\d+)/)?.[1] || T.match(/\b(\d+)\s*coin/)?.[1] || 1;
      await INTENT_MAP.vending_coin?.(n, suppress);
      return true;
    }

    if (T.includes("select") || T.includes("buy")) {
      await INTENT_MAP.vending_select?.(undefined, suppress);
      return true;
    }

    return false;
  };

  /* ---------------------- send flow ---------------------- */
  const send = async (text) => {
    if (!text?.trim() || busy) return;
    setError("");
    setBusy(true);
    push("user", text);

    try {
      await sleep(100);

      // server: send plain string payload { message }
      const res = await api.chat(text);

      // push server reply (string or object)
      const replyText =
        typeof res === "string" ? res :
        res?.reply ?? JSON.stringify(res);

      if (replyText) push("assistant", replyText);

      // execute intent (if provided) but suppress another assistant bubble if reply already shown
      let handled = await applyIntent(res?.intent, res?.arg, { suppressMessage: !!replyText });
      setLastDebug({ intent: res?.intent, arg: res?.arg, hints: res?.hints });

      // if no structured intent, try to infer and suppress messages if server already replied
      if (!handled) await applyFallbackFromText(text, { suppress: !!replyText });

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
      const t = input;
      setInput("");
      send(t);
    }
  };

  /* ---------------------- lexicon ops ---------------------- */
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

  /* ---------------------- quick actions ---------------------- */
  const quick = [
    { label: "Traffic → Next", intent: "traffic_next" },
    { label: "Elevator ↑",     intent: "elevator_up" },
    { label: "Elevator ↓",     intent: "elevator_down" },
    { label: "Coin 2",         intent: "vending_coin", arg: "2" },
    { label: "Select",         intent: "vending_select" },
  ];
  const runQuick = async (qa) => {
    if (busy) return;
    // Quick actions are *local intents*; we execute and also show a small ghost user message
    push("user", qa.label);
    await applyIntent(qa.intent, qa.arg, { suppressMessage: false });
    notifyRefresh();
  };

  /* ---------------------- UI ---------------------- */
  return (
    <div className="card">
      <div className="row gap">
        {/* Lexicon */}
        <div className="col" style={{ flex: "0 0 420px" }}>
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

        {/* Conversation */}
        <div className="col">
          <div className="row items-center space-between">
            <h3 className="muted">Conversation</h3>
            <div className="row gap-s">
              <button className="pill" onClick={() => setMsgs([])}>Clear</button>
              <button className="pill" onClick={copyChat}>Copy</button>
              <button className="pill" onClick={() => setDebugOn(v => !v)}>{debugOn ? "Debug: On" : "Debug: Off"}</button>
            </div>
          </div>

          <div className="chatbox" ref={chatBoxRef}>
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
                <span>intent: <b>{String(lastDebug.intent ?? "–")}</b></span>
                <span>arg: <b>{String(lastDebug.arg ?? "–")}</b></span>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* quick actions */}
          <div className="row gap wrap" style={{ marginTop: 8 }}>
            {quick.map(q => (
              <button key={q.label} className="pill" disabled={busy} onClick={() => runQuick(q)}>
                {q.label}
              </button>
            ))}
          </div>

          {/* composer */}
          <div className="row gap" style={{ marginTop: 12 }}>
            <input
              className="grow"
              placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              className="primary"
              onClick={() => { const t = input; setInput(""); send(t); }}
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
