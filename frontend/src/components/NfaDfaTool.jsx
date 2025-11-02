import React, { useState } from 'react'
import { api } from '../api'

const sample = {
  "states": ["q0","q1","qf"],
  "alphabet": ["a","b"],
  "start": "q0",
  "finals": ["qf"],
  "transitions": {
    "q0": {"a": ["q1"]},
    "q1": {"b": ["qf"]},
    "qf": {}
  }
}

export default function NfaDfaTool(){
  const [payload, setPayload] = useState(JSON.stringify(sample, null, 2))
  const [out, setOut] = useState("")

  const convert = async () => {
    try {
      const data = JSON.parse(payload)
      const res = await api.nfaToDfa(data)
      setOut(JSON.stringify(res, null, 2))
    } catch (e) {
      setOut(String(e))
    }
  }

  return (
    <div className="col">
      <h2>NFA → DFA</h2>
      <textarea value={payload} onChange={e => setPayload(e.target.value)} className="mono" />
      <div className="row">
        <button onClick={convert}>Convert</button>
      </div>
      <pre className="mono" style={{minHeight:120}}>{out}</pre>
    </div>
  )
}
