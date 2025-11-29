import React from "react";
import DecryptedText from "./DecryptedText.jsx";

export default function Footer() {
  return (
    <footer style={{ marginTop: 24, padding: "16px 0", borderTop: "1px solid #223" }}>
      <div className="wrap" style={{ maxWidth: 1200, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between" }}>
        <div className="col">
          <strong><DecryptedText text="AutoCity - Theory of Computation Playground" animateOn="both" revealDirection="center" speed={90} /></strong>
          <small className="muted">FSMs for traffic/elevator/vending - DAFSA lexicon - NFA/DFA - PDA Lab - Regex Runner</small>
          <small className="muted">Presented to Dr Mohammad Al Abed</small>
          <small className="muted">Course: COSC421</small>
        </div>
        <div className="col" style={{ minWidth: 240 }}>
          <small className="muted">Stack: FastAPI - React - Python</small>
          <small className="muted">Rafic Hariri University (RHU)</small>
          <small className="muted">Github Repo:</small>
          <small className="muted">
            <a href="https://github.com/adhamwh/AutoCity" target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
              https://github.com/adhamwh/AutoCity
            </a>
          </small>
        </div>
      </div>
    </footer>
  );
}
