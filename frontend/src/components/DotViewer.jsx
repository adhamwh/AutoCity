import React, { useEffect, useRef } from "react";
import { select } from "d3";
import { graphviz } from "d3-graphviz";

export default function DotViewer({ dot="" }){
  const ref = useRef(null);

  useEffect(()=>{
    if(!dot || !ref.current) return;
    const el = select(ref.current);
    el.selectAll("*").remove();
    try {
      graphviz(ref.current, { useWorker: false }).renderDot(dot);
    } catch (e) {
      el.append("pre").attr("class", "mono").text("DOT render error:\\n" + e);
    }
  }, [dot]);

  return <div ref={ref} style={{minHeight:260}}/>;
}
