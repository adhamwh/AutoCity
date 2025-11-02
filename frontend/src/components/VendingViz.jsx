import React, { useRef, useEffect } from "react";

export default function VendingViz({ state="IDLE", credit=0 }) {
  const ref = useRef(0);
  useEffect(()=>{ ref.current = credit; }, [credit]);

  const flash = credit > ref.current ? "#2dd4bf" : "#9fb0d7";

  return (
    <div style={{display:"flex", alignItems:"center", gap:16}}>
      <div style={{width:160, border:"1px solid #2a355a", background:"#0e1530", borderRadius:12, padding:10}}>
        <div style={{
          height:26, display:"flex", alignItems:"center", justifyContent:"space-between",
          background:"#05102a", border:"1px solid #2a355a", borderRadius:6, marginBottom:8, padding:"2px 8px"
        }}>
          <span style={{color:"#9fb0d7"}}>Credit</span>
          <span style={{color:flash, fontWeight:700}}> {credit} </span>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:6}}>
          {["A1","A2","B1","B2","C1","C2"].map(k => (
            <div key={k} style={{
              height:28, border:"1px solid #2a355a", borderRadius:6,
              background:"#15224a", display:"grid", placeItems:"center", color:"#9fb0d7"
            }}>{k}</div>
          ))}
        </div>
      </div>
      <div className="pill">Vending: {state}</div>
    </div>
  );
}
