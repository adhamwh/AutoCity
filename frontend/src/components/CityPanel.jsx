import React, { useEffect, useState } from "react";
import { api } from "../api";
import TrafficLight from "./Trafficlight.jsx";
import ElevatorViz from "./ElevatorViz.jsx";
import VendingViz from "./VendingViz.jsx";

export default function CityPanel(){
  const [traffic, setTraffic] = useState("…");
  const [elev, setElev] = useState({state:"…", floor:0});
  const [vend, setVend] = useState({state:"…", credit:0});

  const refresh = async () => {
    setTraffic((await api.trafficState()).state);
    setElev(await api.elevatorState());
    setVend(await api.vendingState());
  };
  useEffect(()=>{ refresh(); }, []);

  return (
    <div className="col">
      <h2>City Control</h2>

      <div className="card" style={{background:"transparent", border:"1px dashed var(--border)"}}>
        <div className="row" style={{justifyContent:"space-between", gap:24, flexWrap:"wrap"}}>
          <TrafficLight state={traffic}/>
          <div className="row" style={{gap:8}}>
            <button className="secondary" onClick={async ()=>{await api.trafficEvent("timer"); refresh();}}>Next Light</button>
          </div>
        </div>
      </div>

      <div className="card" style={{background:"transparent", border:"1px dashed var(--border)"}}>
        <div className="row" style={{justifyContent:"space-between", gap:24, flexWrap:"wrap"}}>
          <ElevatorViz state={elev.state} floor={elev.floor}/>
          <div className="row" style={{gap:8}}>
            <button className="secondary" onClick={async ()=>{await api.elevatorEvent("call_up"); await api.elevatorEvent("arrive"); refresh();}}>Up</button>
            <button className="secondary" onClick={async ()=>{await api.elevatorEvent("call_down"); await api.elevatorEvent("arrive"); refresh();}}>Down</button>
            <button className="secondary" onClick={async ()=>{await api.elevatorEvent("close"); refresh();}}>Close</button>
          </div>
        </div>
      </div>

      <div className="card" style={{background:"transparent", border:"1px dashed var(--border)"}}>
        <div className="row" style={{justifyContent:"space-between", gap:24, flexWrap:"wrap"}}>
          <VendingViz state={vend.state} credit={vend.credit}/>
          <div className="row" style={{gap:8}}>
            <button className="secondary" onClick={async ()=>{await api.vendingEvent("coin_2"); refresh();}}>Coin 2</button>
            <button className="secondary" onClick={async ()=>{await api.vendingEvent("coin_3"); refresh();}}>Coin 3</button>
            <button className="secondary" onClick={async ()=>{await api.vendingEvent("select"); refresh();}}>Select</button>
            <button className="secondary" onClick={async ()=>{await api.vendingEvent("done"); refresh();}}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}
