/**
 * Runs the API and the Vite dev server together:
 *   npm run dev        → API (default :4000) + Vite (:5173)
 *   npm run dev:api    → API only
 *
 * The browser only ever talks to the Vite origin; Vite proxies /api and /uploads
 * to the API, so there are no CORS problems and cookies stay first-party.
 */
import 'dotenv/config'
import { spawn } from 'node:child_process'

const children = []

function start(name, command, args, env = {}) {
  const child = spawn(command, args, {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  })
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n[${name}] exited with code ${code}`)
    }
    shutdown()
  })
  children.push(child)
  return child
}

let closing = false
function shutdown() {
  if (closing) return
  closing = true
  children.forEach((child) => {
    if (!child.killed) child.kill('SIGTERM')
  })
  setTimeout(() => process.exit(0), 500).unref()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

const apiPort = process.env.PORT || '4000'
console.log(`\n  Starting hospital CMS…\n  · API on :${apiPort}\n  · Front-end on :5173 (proxies /api)\n`)

start('api', process.execPath, ['server/index.js'], { PORT: apiPort })
start('vite', 'npx', ['vite', '--host', '0.0.0.0'], {})
