import React from "react";

export default function TrafficLight({ state="RED" }) {
  const on = (s) => state === s ? 1 : 0.15;
  return (
    <div style={{display:"flex", alignItems:"center", gap:16}}>
      <div style={{background:"#0e1530", border:"1px solid #2a355a", borderRadius:14, padding:12, width:80}}>
        <div style={{width:48, height:48, borderRadius:"50%", margin:"8px auto", background:"#ff4b4b", opacity:on("RED")}} />
        <div style={{width:48, height:48, borderRadius:"50%", margin:"8px auto", background:"#3be277", opacity:on("GREEN")}} />
        <div style={{width:48, height:48, borderRadius:"50%", margin:"8px auto", background:"#ffd166", opacity:on("YELLOW")}} />
      </div>
      <div>
        <div className="pill">Traffic: {state}</div>
      </div>
    </div>
  );
}
