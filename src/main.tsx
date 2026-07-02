import { render } from 'preact'
import { App } from './app.tsx'
import './styles/tokens.css'

// Global styles
const style = document.createElement('style')
style.textContent = `
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  html, body {
    height: 100%;
    font-family: var(--font-sans);
    background: var(--color-bg);
    color: var(--color-text);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
    overscroll-behavior: none;
  }
  #app {
    min-height: 100%;
    padding-top: var(--safe-area-top);
  }
  :focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }
  button {
    transition: transform var(--transition-fast), filter var(--transition-fast), color var(--transition-fast);
  }
  button:active {
    transform: scale(0.97);
  }
  @media (hover: hover) {
    button:hover {
      filter: brightness(1.12);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`
document.head.appendChild(style)

render(<App />, document.getElementById('app')!)
