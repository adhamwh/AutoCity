import React, { useEffect, useState } from "react";
import { api, setApiBase } from "./api";
import ChatPanel from "./components/ChatPanel.jsx";
import CityPanel from "./components/CityPanel.jsx";
import AutomataPanel from "./components/AutomataPanel.jsx";
import PdaLab from "./components/PdaLab.jsx";
import RegexRunner from "./components/RegexRunner.jsx";
import Footer from "./components/Footer.jsx";
import DecryptedText from "./components/DecryptedText.jsx";
import FaultyTerminal from "./components/FaultyTerminal.jsx";

export default function App() {
  const [base, setBase] = useState(localStorage.getItem("apiBase") || "http://127.0.0.1:8000");
  const [health, setHealth] = useState("…");

  useEffect(() => { api.health().then(x => setHealth(JSON.stringify(x))); }, []);

  return (
    <div>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.5 }}>
        <FaultyTerminal
          scale={2}
          gridMul={[2, 1]}
          digitSize={2}
          timeScale={0.5}
          pause={false}
          scanlineIntensity={0.5}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={0.5}
          chromaticAberration={0}
          dither={0}
          curvature={0.1}
          tint="#8c8fe6"
          mouseReact={true}
          mouseStrength={0.5}
          pageLoadAnimation={true}
          brightness={0.6}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <header style={{padding:"14px 24px", borderBottom:"1px solid #223", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <strong style={{fontSize:24}}>
              <DecryptedText text="AutoCity" animateOn="both" revealDirection="center" speed={90} />
            </strong>
            <span className="pill">Automata-Driven Smart City</span>
          </div>
          <div className="row">
            <input value={base} onChange={e => setBase(e.target.value)} className="mono" style={{minWidth:320}}/>
            <button onClick={() => setApiBase(base)}>Save Base URL</button>
            <small className="pill">Health: {health}</small>
          </div>
        </header>

        <div className="wrap" style={{maxWidth:1200}}>
          <div className="grid" style={{gridTemplateColumns:"1.2fr 1fr"}}>
            <div className="card"><CityPanel/></div>
            <div className="card"><ChatPanel/></div>
          </div>

          <div className="card"><AutomataPanel/></div>
          <div className="card"><PdaLab/></div>
          <div className="card"><RegexRunner/></div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
