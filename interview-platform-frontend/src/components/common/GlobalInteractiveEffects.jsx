import React, { useEffect, useState } from 'react'

/**
 * Global Scroll Progress & Navbar Elevation
 * - Dynamic scroll progress indicator at top of page
 * - Elevated navbar style when scrolled
 * - Zero intrusive click ripples or effects
 */
export function GlobalInteractiveEffects() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop || document.body.scrollTop
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      if (windowHeight > 0) {
        const scrolled = (totalScroll / windowHeight) * 100
        setScrollProgress(Math.min(100, Math.max(0, scrolled)))
      }

      const navbar = document.querySelector('.navbar')
      if (navbar) {
        if (totalScroll > 15) {
          navbar.classList.add('navbar-scrolled')
        } else {
          navbar.classList.remove('navbar-scrolled')
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div
      id="global-scroll-progress-bar"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '3.5px',
        width: `${scrollProgress}%`,
        background: 'linear-gradient(90deg, #38bdf8 0%, #6366f1 50%, #a855f7 100%)',
        boxShadow: '0 0 12px rgba(56, 189, 248, 0.85), 0 0 4px #6366f1',
        zIndex: 99999,
        pointerEvents: 'none',
        transition: 'width 0.1s cubic-bezier(0.22, 1, 0.36, 1)',
        opacity: scrollProgress > 0.5 ? 1 : 0,
      }}
    />
  )
}

export default GlobalInteractiveEffects
