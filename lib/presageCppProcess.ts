// Manages the hello_vitals C++ subprocess
// Spawns the binary, reads JSON lines from stdout, caches the latest vitals

import { spawn, ChildProcess } from 'child_process'
import path from 'path'

export interface CppVitals {
  pulse: number
  breathing: number
  timestamp: number
}

let latestVitals: CppVitals | null = null
let childProcess: ChildProcess | null = null
let started = false

const VITALS_STALE_MS = 30_000 // consider data stale after 30s

export function startCppVitalsProcess() {
  if (started) return
  const apiKey = process.env.SMARTSPECTRA_API_KEY
  if (!apiKey) return

  started = true
  const binaryPath = path.join(process.cwd(), 'presage-cpp', 'build', 'hello_vitals')

  try {
    childProcess = spawn(binaryPath, [apiKey], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SMARTSPECTRA_API_KEY: apiKey },
    })
  } catch {
    started = false
    return
  }

  let buffer = ''

  childProcess.stdout?.on('data', (chunk: Buffer) => {
    buffer += chunk.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const parsed = JSON.parse(trimmed)
        if (typeof parsed.pulse === 'number' && typeof parsed.breathing === 'number') {
          latestVitals = {
            pulse: parsed.pulse,
            breathing: parsed.breathing,
            timestamp: Date.now(),
          }
        }
      } catch {
        // non-JSON lines (e.g. log output) — ignore
      }
    }
  })

  childProcess.stderr?.on('data', (chunk: Buffer) => {
    console.error('[hello_vitals]', chunk.toString().trim())
  })

  childProcess.on('exit', (code) => {
    console.log(`[hello_vitals] process exited with code ${code}`)
    started = false
    childProcess = null
  })
}

export function stopCppVitalsProcess() {
  childProcess?.kill()
  childProcess = null
  started = false
  latestVitals = null
}

/** Returns latest vitals from the C++ process, or null if stale/unavailable */
export function getLatestCppVitals(): CppVitals | null {
  if (!latestVitals) return null
  if (Date.now() - latestVitals.timestamp > VITALS_STALE_MS) return null
  return latestVitals
}

export function isCppProcessRunning(): boolean {
  return started && childProcess !== null
}
