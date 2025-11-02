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
      <h2>Automata Lab</h2>

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
    </div>
  );
}
