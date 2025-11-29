import React, { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import TrafficLight from "./Trafficlight.jsx";
import ElevatorViz from "./ElevatorViz.jsx";
import VendingViz from "./VendingViz.jsx";
import DecryptedText from "./DecryptedText.jsx";

export default function CityPanel() {
  const [traffic, setTraffic] = useState("…");
  const [elev, setElev]     = useState({ state: "…", floor: 0 });
  const [vend, setVend]     = useState({ state: "…", credit: 0 });
  const [showExplain, setShowExplain] = useState(false);

  // Refresh all panels (parallel) + safe setters
  const refresh = useCallback(async () => {
    try {
      const [t, e, v] = await Promise.all([
        api.trafficState(),   // -> {state: "..."} or string in some setups
        api.elevatorState(),  // -> {state, floor}
        api.vendingState(),   // -> {state, credit}
      ]);

      setTraffic(t?.state ?? t); // support either shape
      setElev(e || { state: "…", floor: 0 });
      setVend(v || { state: "…", credit: 0 });
    } catch (err) {
      console.error("City refresh failed:", err);
    }
  }, []);

  // Initial load
  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
  const h = () => refresh();
  window.addEventListener("autocity:refresh", h);
  return () => window.removeEventListener("autocity:refresh", h);
}, [])

  // 👇 Expose refresh so ChatPanel can call it after chat/intents
  useEffect(() => {
    window.__autocity_refresh = refresh;
    return () => { delete window.__autocity_refresh; };
  }, [refresh]);

  return (
    <div className="col">
      <div className="row items-center space-between">
        <h2><DecryptedText text="City Control" animateOn="both" revealDirection="center" speed={90} /></h2>
        <button className="pill" onClick={() => setShowExplain(true)}>How Does This Work?</button>
      </div>

      <div className="card" style={{ background: "transparent", border: "1px dashed var(--border)" }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <TrafficLight state={traffic} />
          <div className="row" style={{ gap: 8 }}>
            <button
              className="secondary"
              onClick={async () => { await api.trafficEvent("timer"); refresh(); }}
            >
              Next Light
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: "transparent", border: "1px dashed var(--border)" }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <ElevatorViz state={elev.state} floor={elev.floor} />
          <div className="row" style={{ gap: 8 }}>
            <button
              className="secondary"
              onClick={async () => {
                await api.elevatorEvent("call_up");
                await api.elevatorEvent("arrive");
                refresh();
              }}
            >
              Up
            </button>
            <button
              className="secondary"
              onClick={async () => {
                await api.elevatorEvent("call_down");
                await api.elevatorEvent("arrive");
                refresh();
              }}
            >
              Down
            </button>
            <button
              className="secondary"
              onClick={async () => { await api.elevatorEvent("close"); refresh(); }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: "transparent", border: "1px dashed var(--border)" }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <VendingViz state={vend.state} credit={vend.credit} />
          <div className="row" style={{ gap: 8 }}>
            <button className="secondary" onClick={async () => { await api.vendingEvent("coin_2"); refresh(); }}>
              Coin 2
            </button>
            <button className="secondary" onClick={async () => { await api.vendingEvent("coin_3"); refresh(); }}>
              Coin 3
            </button>
            <button className="secondary" onClick={async () => { await api.vendingEvent("select"); refresh(); }}>
              Select
            </button>
            <button className="secondary" onClick={async () => { await api.vendingEvent("done"); refresh(); }}>
              Done
            </button>
          </div>
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
            <div className="mono" style={{ lineHeight: 1.6 }}><p><b>Traffic Light</b>: Deterministic FSM with states like RED/GREEN/YELLOW. The <code>timer</code> event advances the state; trigger it with the button or via chat intent.</p><p><b>Elevator</b>: FSM with states such as DOORS_OPEN/MOVING_UP/MOVING_DOWN. Events (call_up, call_down, arrive, close) drive transitions; buttons fire events; the visual tracks state/floor.</p><p><b>Vending</b>: FSM that tracks credit and vend cycles. Coin events add credit; select/done drive transitions like DISPENSE/IDLE.</p><p>Each control sends an event to its FSM through the API, then the UI refreshes to show the current state.</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
