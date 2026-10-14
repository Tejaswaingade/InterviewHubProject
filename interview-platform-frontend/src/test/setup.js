import '@testing-library/jest-dom'

// Mock window.matchMedia for theme context and responsive testing in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock window.scrollTo
window.scrollTo = () => {}

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = () => {}
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = () => {}
}
