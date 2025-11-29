import React from "react";

export default function ElevatorViz({ state = "IDLE", floor = 0 }) {
  const unit = 60;
  const base = 8;
  const safeFloor = Math.max(0, floor || 0);
  const maxFloor = Math.max(2, safeFloor);
  const height = Math.max(200, base + (maxFloor + 1) * unit);
  const y = base + safeFloor * unit;

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <div
        style={{
          position: "relative",
          width: 100,
          height,
          border: "1px solid #2a355a",
          borderRadius: 12,
          background: "#0e1530",
          overflow: "hidden",
        }}
      >
        {/* floor guides */}
        {Array.from({ length: maxFloor + 1 }, (_ , i) => base + i * unit).map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: b,
              height: 1,
              background: "#2a355a",
            }}
          />
        ))}

        {/* elevator car */}
        <div
          style={{
            position: "absolute",
            left: 10,
            right: 10,
            bottom: y,
            height: 54,
            border: "1px solid #39508a",
            borderRadius: 8,
            background: "#15224a",
            transition: "bottom 420ms cubic-bezier(.2,.8,.2,1)",
          }}
        >
          {/* left door */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: state === "DOORS_OPEN" ? "52%" : "50%",
              background: "#1e2a4d",
              transition: "right 260ms ease",
            }}
          />

          {/* right door */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              left: state === "DOORS_OPEN" ? "48%" : "50%",
              background: "#1e2a4d",
              transition: "left 260ms ease",
            }}
          />
        </div>
      </div>

      <div className="pill">Elevator: {state}</div>
      <div className="pill">Floor: {floor}</div>
    </div>
  );
}
