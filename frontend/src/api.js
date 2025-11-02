const API_BASE = localStorage.getItem('apiBase') || 'http://127.0.0.1:8000'

export const setApiBase = (url) => {
  localStorage.setItem('apiBase', url)
  window.location.reload()
}

async function j(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  try { return JSON.parse(text) } catch(e) { return text }
}

export const api = {
  health: () => j('GET', '/api/health'),
  chat: (message) => j('POST', '/api/chat', { message }),
  loadLex: (lexmap) => j('POST', '/api/chat/lexicon/load', { lexmap }),
  trafficState: () => j('GET', '/api/fsm/traffic'),
  trafficEvent: (event) => j('POST', '/api/fsm/traffic', { event }),
  elevatorState: () => j('GET', '/api/fsm/elevator'),
  elevatorEvent: (event) => j('POST', '/api/fsm/elevator', { event }),
  vendingState: () => j('GET', '/api/fsm/vending'),
  vendingEvent: (event) => j('POST', '/api/fsm/vending', { event }),
  dafsaBuild: (words) => j('POST', '/api/automata/dafsa/build', words),
  dafsaDot: () => j('GET', '/api/automata/dafsa/dot'),
  nfaToDfa: (payload) => j('POST', '/api/automata/nfa_to_dfa', payload),
}


// --- compatibility shims so UI code can call high-level helpers ---

// optional: mirror the base-URL helpers some parts of the UI expect
api.setBaseUrl = (url) => { localStorage.setItem('apiBase', url); window.location.reload(); };
api.getBaseUrl = () => localStorage.getItem('apiBase') || 'http://127.0.0.1:8000';

// Lexicon loader: ChatPanel may call api.chatLexiconLoad({lexmap}) or api.chat_lexicon_load(...)
api.chatLexiconLoad = ({ lexmap }) => api.loadLex(lexmap);
api.chat_lexicon_load = (payload) => api.chatLexiconLoad(payload);

// FSM helpers used by quick-action buttons
api.trafficNext   = ()         => api.trafficEvent('next');

api.elevatorUp    = ()         => api.elevatorEvent('up');
api.elevatorDown  = ()         => api.elevatorEvent('down');

api.vendingCoin   = (n = 1)    => api.vendingEvent(`coin_${n}`);
api.vendingSelect = ()         => api.vendingEvent('select');
// (optionally) end a vend if you add a button later
api.vendingDone   = ()         => api.vendingEvent('done');
