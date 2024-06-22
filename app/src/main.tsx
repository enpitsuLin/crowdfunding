import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '@unocss/reset/tailwind.css'
import 'uno.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
