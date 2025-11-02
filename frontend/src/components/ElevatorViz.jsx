import React from "react";

export default function ElevatorViz({ state="IDLE", floor=0 }) {
  return (
    <div style={{display:"flex", gap:16}}>
      <div style={{position:"relative", width:90, height:200, border:"1px solid #2a355a", borderRadius:12, background:"#0e1530"}}>
        <div style={{
          position:"absolute", left:8, right:8,
          bottom:8 + floor*60,  /* 3 floors (0,1,2) => tune as needed */
          height:50, border:"1px solid #39508a", borderRadius:8, background:"#15224a",
          transition:"bottom 300ms"
        }}/>
        <div style={{position:"absolute", left:0, right:0, bottom:8, height:1, background:"#2a355a"}}/>
        <div style={{position:"absolute", left:0, right:0, bottom:68, height:1, background:"#2a355a"}}/>
        <div style={{position:"absolute", left:0, right:0, bottom:128, height:1, background:"#2a355a"}}/>
      </div>
      <div>
        <div className="pill">Elevator: {state}</div>
        <div className="pill">Floor: {floor}</div>
      </div>
    </div>
  );
}
