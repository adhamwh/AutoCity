import React, { useState } from "react";
import { api } from "../api";
import DotViewer from "./DotViewer.jsx";

const seed = ["aa","aab","aaab","aba","abab","ba","baab","bab","bba","bbab"];
const sampleNFA = {
  "states": ["q0","q1","qf"],
  "alphabet": ["a","b"],
  "start": "q0",
  "finals": ["qf"],
  "transitions": { "q0": {"a":["q1"]}, "q1":{"b":["qf"]}, "qf":{} }
};

export default function AutomataPanel(){
  const [words, setWords] = useState(seed.join("\\n"));
  const [dafsaStats, setDafsaStats] = useState("");
  const [dafsaDot, setDafsaDot] = useState("");
  const [nfa, setNfa] = useState(JSON.stringify(sampleNFA, null, 2));
  const [dfaOut, setDfaOut] = useState("");

  const build = async () => {
    const list = words.split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean);
    const res = await api.dafsaBuild(list);
    setDafsaStats(JSON.stringify(res, null, 2));
    const dot = await api.dafsaDot();
    setDafsaDot(typeof dot === "string" ? dot : JSON.stringify(dot));
  };

  const copyDot = async () => {
    if (!dafsaDot) return;
    await navigator.clipboard.writeText(dafsaDot);
    alert("DOT copied to clipboard.");
  };

  const downloadDot = () => {
    if (!dafsaDot) return;
    const blob = new Blob([dafsaDot], {type:"text/plain"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "dafsa.dot";
    a.click();
  };

  const convert = async () => {
    try {
      const payload = JSON.parse(nfa);
      const out = await api.nfaToDfa(payload);
      setDfaOut(JSON.stringify(out, null, 2));
    } catch(e) { setDfaOut(String(e)); }
  };

  return (
    <div className="col">
      <h2>Automata Lab</h2>

      <div className="grid" style={{gridTemplateColumns:"1fr 1fr"}}>
        <div className="col">
          <small>DAFSA (words)</small>
          <textarea value={words} onChange={e=>setWords(e.target.value)} />
          <div className="row">
            <button onClick={build}>Build & Minimize</button>
            <button className="secondary" onClick={copyDot}>Copy DOT</button>
            <button className="secondary" onClick={downloadDot}>Download DOT</button>
          </div>
          <pre className="mono">{dafsaStats}</pre>
        </div>

        <div className="col">
          <small>DAFSA Graph</small>
          <DotViewer dot={dafsaDot}/>
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:"1fr 1fr", marginTop:12}}>
        <div className="col">
          <small>NFA (JSON)</small>
          <textarea className="mono" value={nfa} onChange={e=>setNfa(e.target.value)} />
          <div className="row"><button onClick={convert}>Convert to DFA</button></div>
        </div>
        <div className="col">
          <small>DFA (JSON)</small>
          <pre className="mono" style={{minHeight:200}}>{dfaOut}</pre>
        </div>
      </div>
    </div>
  );
}
