import React from 'react'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="hero">
        <h1>Había una vez Virtual</h1>
        <p className="subtitle">Gestión inteligente para tu cafetería</p>
      </header>
      <main className="content">
        <section className="status-card">
          <h2>Firebase Status</h2>
          <div className="status-grid">
            <div className="status-item">
              <span className="dot active"></span>
              Firestore
            </div>
            <div className="status-item">
              <span className="dot active"></span>
              Authentication
            </div>
            <div className="status-item">
              <span className="dot active"></span>
              Storage
            </div>
            <div className="status-item">
              <span className="dot active"></span>
              Functions
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
