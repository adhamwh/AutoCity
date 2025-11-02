import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function FsmSection(){
  const [traffic, setTraffic] = useState('…')
  const [elev, setElev] = useState({state:'…', floor:0})
  const [vend, setVend] = useState({state:'…', credit:0})

  const refresh = async () => {
    const t = await api.trafficState()
    const e = await api.elevatorState()
    const v = await api.vendingState()
    setTraffic(t.state)
    setElev(e)
    setVend(v)
  }

  useEffect(() => { refresh() }, [])

  return (
    <div className="col">
      <h2>City FSMs</h2>
      <div className="row">
        <div className="pill">Traffic: {traffic}</div>
        <button className="secondary" onClick={async ()=>{await api.trafficEvent("timer"); refresh()}}>Next Light</button>
      </div>

      <div className="row">
        <div className="pill">Elevator: {elev.state} (floor {elev.floor})</div>
        <button className="secondary" onClick={async ()=>{await api.elevatorEvent("call_up"); await api.elevatorEvent("arrive"); refresh()}}>Up</button>
        <button className="secondary" onClick={async ()=>{await api.elevatorEvent("call_down"); await api.elevatorEvent("arrive"); refresh()}}>Down</button>
        <button className="secondary" onClick={async ()=>{await api.elevatorEvent("close"); refresh()}}>Close</button>
      </div>

      <div className="row">
        <div className="pill">Vending: {vend.state} (credit {vend.credit})</div>
        <button className="secondary" onClick={async ()=>{await api.vendingEvent("coin_2"); refresh()}}>Coin 2</button>
        <button className="secondary" onClick={async ()=>{await api.vendingEvent("coin_3"); refresh()}}>Coin 3</button>
        <button className="secondary" onClick={async ()=>{await api.vendingEvent("select"); refresh()}}>Select</button>
        <button className="secondary" onClick={async ()=>{await api.vendingEvent("done"); refresh()}}>Done</button>
      </div>
    </div>
  )
}
