import React, { useEffect, useRef } from "react";
import { select } from "d3";
import { graphviz } from "d3-graphviz";

// Configure @hpcc-js/wasm only once per session (survives Vite HMR)
let wasmConfigured = false;

async function ensureWasmConfigured() {
  if (wasmConfigured) return;

  // Dynamic import so a bad export can't crash the bundle at import time
  const mod = await import("@hpcc-js/wasm");

  // Try both module shapes. Some versions export at top-level, others under default.
  const wasmFolderFn =
    (typeof mod.wasmFolder === "function" && mod.wasmFolder) ||
    (mod?.default && typeof mod.default.wasmFolder === "function" && mod.default.wasmFolder);

  if (wasmFolderFn) {
    // Tell the runtime where to load wasm assets
    wasmFolderFn("https://unpkg.com/@hpcc-js/wasm/dist/");
    wasmConfigured = true;
    return;
  }

  // Fallback: expose the module globally – d3-graphviz will pick it up
  // eslint-disable-next-line no-undef
  window["@hpcc-js/wasm"] = mod?.default ?? mod;
  wasmConfigured = true;
}

export default function DotViewer({ dot = "", onReadySvg }) {
  const ref = useRef(null);

  useEffect(() => {
    (async () => {
      const host = ref.current;
      if (!host || !dot) return;

      const el = select(host);
      el.selectAll("*").remove();

      try {
        await ensureWasmConfigured();
        graphviz(host, { useWorker: false }).renderDot(dot, () => {
          const svg = host.querySelector("svg");
          if (onReadySvg && svg) onReadySvg(svg);
        });
      } catch (e) {
        el.append("pre")
          .attr("class", "mono")
          .text("WASM/DOT error:\n" + (e?.message || e));
      }
    })();
  }, [dot, onReadySvg]);

  return <div ref={ref} style={{ minHeight: 260 }} />;
}
