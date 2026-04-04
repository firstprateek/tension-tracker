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
  }
`
document.head.appendChild(style)

render(<App />, document.getElementById('app')!)
