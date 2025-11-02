import React from "react";

export default function TrafficLight({ state="RED" }) {
  const on = (s) => state === s ? 1 : 0.18;
  const glow = (s, color) =>
    state === s ? `0 0 12px ${color}, 0 0 26px ${color}66` : "none";

  const lamp = (s, color) => (
    <div style={{
      width:48, height:48, borderRadius:"50%", margin:"8px auto",
      background:color, opacity:on(s), boxShadow:glow(s, color),
      transition:"opacity 220ms ease, box-shadow 220ms ease"
    }}/>
  );

  return (
    <div style={{display:"flex", alignItems:"center", gap:16}}>
      <div style={{
        background:"#0e1530", border:"1px solid #2a355a",
        borderRadius:14, padding:12, width:80
      }}>
        {lamp("RED",    "#ff4b4b")}
        {lamp("GREEN",  "#3be277")}
        {lamp("YELLOW", "#ffd166")}
      </div>
      <div className="pill">Traffic: {state}</div>
    </div>
  );
}
