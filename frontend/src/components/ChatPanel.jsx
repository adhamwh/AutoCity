import React, { useEffect, useState } from "react";
import { api } from "../api";

const defaultLex = {
  "traffic":["traffic"],
  "next":["traffic_next"], "timer":["traffic_next"], "advance":["traffic_next"],
  "elevator":["elevator"], "up":["up"], "down":["down"],
  "vending":["vending"], "coin":["vending"], "select":["vending"]
};

export default function ChatPanel(){
  const [lex, setLex] = useState(JSON.stringify(defaultLex, null, 2));
  const [input, setInput] = useState("please advance the traffic light");
  const [msgs, setMsgs] = useState([{role:"system", text:"Load lexicon to enable intents…"}]);

  const push = (role, text) => setMsgs(m => [...m, {role, text}]);

  useEffect(() => {
    // auto-load on first mount
    (async () => {
      const res = await api.loadLex(defaultLex);
      push("system", `Lexicon loaded (${res.loaded})`);
    })();
  }, []);

  const send = async () => {
    const msg = input.trim();
    if (!msg) return;
    push("user", msg);
    setInput("");
    const res = await api.chat(msg);
    push("assistant", JSON.stringify(res, null, 2));
  };

  return (
    <div className="col">
      <h2>Chatbot</h2>

      <div className="grid" style={{gridTemplateColumns:"1fr 1fr"}}>
        <div className="col">
          <small>Lexicon (DAFSA-backed)</small>
          <textarea value={lex} onChange={e => setLex(e.target.value)} />
          <div className="row">
            <button onClick={async ()=>{
              const res = await api.loadLex(JSON.parse(lex));
              push("system", `Lexicon loaded (${res.loaded})`);
            }}>Load Lexicon</button>
          </div>
        </div>

        <div className="col">
          <small>Conversation</small>
          <div style={{height:260, overflow:"auto", background:"#0e1530", border:"1px solid var(--border)", borderRadius:10, padding:10}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{marginBottom:10, display:"flex", justifyContent: m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{
                  maxWidth:"90%", whiteSpace:"pre-wrap",
                  background: m.role==="user" ? "#2a3b67" : "#16224a",
                  border:"1px solid var(--border)", borderRadius:12, padding:"8px 10px"
                }}>
                  <div style={{fontSize:12, color:"#9fb0d7", marginBottom:4}}>{m.role}</div>
                  <div className="mono">{m.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="row">
            <input className="mono" value={input} onChange={e=>setInput(e.target.value)} style={{flex:1}}/>
            <button onClick={send}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
