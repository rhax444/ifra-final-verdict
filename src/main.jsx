import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { useGame } from './store/useGame'
import * as registry from './game/registry'
import * as director from './game/director'

if (import.meta.env.DEV) window.__game = { useGame, registry, director }

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
