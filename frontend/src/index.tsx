import { render } from 'solid-js/web'
import App from './App'
import './index.css'
import { logger, LogLevel } from './utils/logger'

// Configure logger based on environment
if (import.meta.env.PROD) {
  // In production, only show errors and warnings
  logger.setLevel(LogLevel.WARN)
  logger.info('Logger initialized in production mode (showing WARN and ERROR only)')
} else if (import.meta.env.DEV) {
  // In development, show all logs
  logger.setLevel(LogLevel.DEBUG)
  logger.info('Logger initialized in development mode (showing all logs)')
}

const root = document.getElementById('root')

if (root) {
  render(() => <App />, root)
}
