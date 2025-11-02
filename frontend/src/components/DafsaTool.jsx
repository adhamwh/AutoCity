import React, { useState } from 'react'
import { api } from '../api'

const seed = ["aa","aab","aaab","aba","abab","ba","baab","bab","bba","bbab"]

export default function DafsaTool(){
  const [words, setWords] = useState(seed.join("\n"))
  const [stats, setStats] = useState("")
  const [dot, setDot] = useState("")

  const build = async () => {
    const list = words.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
    const res = await api.dafsaBuild(list)
    setStats(JSON.stringify(res))
  }

  const fetchDot = async () => {
    const text = await api.dafsaDot()
    setDot(typeof text === 'string' ? text : JSON.stringify(text,null,2))
  }

  return (
    <div className="col">
      <h2>DAFSA Tool</h2>
      <textarea value={words} onChange={e => setWords(e.target.value)} />
      <div className="row">
        <button onClick={build}>Build & Minimize</button>
        <button className="secondary" onClick={fetchDot}>Get DOT</button>
      </div>
      <pre className="mono">{stats}</pre>
      <pre className="mono">{dot}</pre>
      <small>Copy DOT into an online Graphviz viewer to visualize.</small>
    </div>
  )
}
