import React, { useState, useRef } from "react";
import { api } from "../api";
import DotViewer from "./DotViewer.jsx";

const seed = ["aa","aab","aaab","aba","abab","ba","baab","bab","bba","bbab"];
const sampleNFA = {
  states: ["q0","q1","qf"],
  alphabet: ["a","b"],
  start: "q0",
  finals: ["qf"],
  transitions: { q0: {a:["q1"]}, q1:{b:["qf"]}, qf:{} }
};

// Convert DFA JSON (from API) to DOT string
function dfaToDot(dfa) {
  const lines = ['digraph DFA {', 'rankdir=LR;', 'node [shape=circle, fontsize=11];'];
  // invisible start arrow
  lines.push(`__start [shape=point, label=""];`);
  lines.push(`__start -> "${dfa.start}";`);
  // finals doublecircle
  if (dfa.finals && dfa.finals.length) {
    lines.push(`{ node [shape=doublecircle]; ${dfa.finals.map(s=>`"${s}"`).join(' ')} }`);
    lines.push(`node [shape=circle];`);
  }
  // transitions
  for (const [from, edges] of Object.entries(dfa.transitions || {})) {
    for (const [sym, to] of Object.entries(edges || {})) {
      lines.push(`"${from}" -> "${to}" [label="${sym}"];`);
    }
  }
  lines.push('}');
  return lines.join('\n');
}

export default function AutomataPanel(){
  const [words, setWords] = useState(seed.join("\n"));
  const [dafsaStats, setDafsaStats] = useState("");
  const [dafsaDot, setDafsaDot] = useState("");
  const [nfa, setNfa] = useState(JSON.stringify(sampleNFA, null, 2));
  const [dfaOut, setDfaOut] = useState("");
  const [dfaDot, setDfaDot] = useState("");
  const [showExplain, setShowExplain] = useState(false);

  // keep svg handles for export
  const dafsaSvgRef = useRef(null);
  const dfaSvgRef   = useRef(null);

  const build = async () => {
    const list = words.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const res = await api.dafsaBuild(list);
    setDafsaStats(JSON.stringify(res, null, 2));
    const dot = await api.dafsaDot();
    setDafsaDot(typeof dot === "string" ? dot : JSON.stringify(dot));
  };

  const convert = async () => {
    try {
      const payload = JSON.parse(nfa);
      const out = await api.nfaToDfa(payload);
      setDfaOut(JSON.stringify(out, null, 2));
      setDfaDot(dfaToDot(out));
    } catch(e) { setDfaOut(String(e)); }
  };

  const exportSvg = (svg) => {
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], {type:"image/svg+xml"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "graph.svg";
    a.click();
  };

  const exportPng = async (svg) => {
    if (!svg) return;
    const s = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([s], {type: "image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);

    const img = new Image();
    const scale = 2; // retina export
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((pngBlob)=>{
        const a = document.createElement("a");
        a.href = URL.createObjectURL(pngBlob);
        a.download = "graph.png";
        a.click();
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="col">
      <div className="row items-center space-between">
        <h2>Automata Lab</h2>
        <button className="pill" onClick={() => setShowExplain(true)}>How Does This Work?</button>
      </div>

      <div className="grid" style={{gridTemplateColumns:"1fr 1fr"}}>
        <div className="col">
          <small>DAFSA (words)</small>
          <textarea value={words} onChange={e=>setWords(e.target.value)} />
          <div className="row">
            <button onClick={build}>Build & Minimize</button>
            <button className="secondary" onClick={()=>exportSvg(dafsaSvgRef.current)}>Export SVG</button>
            <button className="secondary" onClick={()=>exportPng(dafsaSvgRef.current)}>Export PNG</button>
          </div>
          <pre className="mono">{dafsaStats}</pre>
        </div>

        <div className="col">
          <small>DAFSA Graph</small>
          <DotViewer dot={dafsaDot} onReadySvg={(svg)=> (dafsaSvgRef.current = svg)} />
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:"1fr 1fr", marginTop:12}}>
        <div className="col">
          <small>NFA (JSON)</small>
          <textarea className="mono" value={nfa} onChange={e=>setNfa(e.target.value)} />
          <div className="row">
            <button onClick={convert}>Convert to DFA</button>
            <button className="secondary" onClick={()=>exportSvg(dfaSvgRef.current)}>Export DFA SVG</button>
            <button className="secondary" onClick={()=>exportPng(dfaSvgRef.current)}>Export DFA PNG</button>
          </div>
          <pre className="mono" style={{minHeight:120}}>{dfaOut}</pre>
        </div>
        <div className="col">
          <small>DFA Graph</small>
          <DotViewer dot={dfaDot} onReadySvg={(svg)=> (dfaSvgRef.current = svg)} />
        </div>
      </div>

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
              <p><b>DAFSA</b>: Builds a Deterministic Acyclic Finite State Automaton from the word list. Sorting and incremental insert yield a compact trie-like automaton; minimization merges equivalent suffixes. Acceptance is by reaching a final state.</p>
              <p><b>NFA → DFA</b>: The JSON on the left defines an NFA (states, alphabet, start, finals, transitions). The subset construction produces an equivalent DFA, rendered on the right. Acceptance is by ending in any DFA state that includes an original NFA final.</p>
              <p><b>DOT & exports</b>: Graphs are rendered from DOT via Graphviz in the browser; you can export SVG/PNG snapshots.</p>
              <p>Core ToC ideas: regular languages, deterministic vs non-deterministic automata, language equivalence via NFA→DFA, and state minimization for compact DAFSAs.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
