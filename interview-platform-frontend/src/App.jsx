import React from 'react'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import AppRoutes from './routes/AppRoutes'
import GlobalInteractiveEffects from './components/common/GlobalInteractiveEffects'

export function App() {
  return (
    <div className="app-container" id="app-root">
      <GlobalInteractiveEffects />
      <Navbar />
      <main className="main-content" id="main-content">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  )
}

export default App
