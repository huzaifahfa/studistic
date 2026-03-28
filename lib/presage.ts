// Presage Health API integration
// Analyzes facial video for vital signs using rPPG (remote photoplethysmography)
// When SMARTSPECTRA_API_KEY is set, uses the local C++ hello_vitals binary for
// pulse and breathing rate; falls back to the Presage REST API or mock data.

import { getLatestCppVitals, startCppVitalsProcess } from './presageCppProcess'

const PRESAGE_API_URL = process.env.PRESAGE_API_URL || 'https://api.presagetech.com/v1'
const PRESAGE_API_KEY = process.env.PRESAGE_API_KEY || ''

// Ensure the C++ process is running whenever this module is imported server-side
if (typeof window === 'undefined') {
  startCppVitalsProcess()
}

export interface HealthMetrics {
  heartRate: number        // BPM
  hrvScore: number         // Heart Rate Variability (0-100)
  stressLevel: number      // 0-100
  respirationRate: number  // breaths per minute
  eyeConcentration: number // 0-100 (focus level)
  oxygenSaturation: number // SpO2 %
  fatigueLevel: number     // 0-100
  timestamp: number
}

export async function analyzeFromFrame(imageBase64: string, sessionId: string): Promise<HealthMetrics> {
  // Priority 1: live data from the C++ hello_vitals process
  const cppVitals = getLatestCppVitals()
  if (cppVitals) {
    return buildMetricsFromCpp(cppVitals.pulse, cppVitals.breathing)
  }

  // Priority 2: Presage REST API (full metrics via cloud)
  if (PRESAGE_API_KEY) {
    return analyzeViaRestApi(imageBase64, sessionId)
  }

  // Priority 3: realistic mock data for demo / local dev
  return generateMockMetrics()
}

async function analyzeViaRestApi(imageBase64: string, sessionId: string): Promise<HealthMetrics> {
  const response = await fetch(`${PRESAGE_API_URL}/analyze/frame`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PRESAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: imageBase64,
      session_id: sessionId,
      analysis_type: ['heart_rate', 'hrv', 'stress', 'eye_concentration', 'fatigue', 'respiration'],
    }),
  })

  if (!response.ok) {
    throw new Error(`Presage API error: ${response.status}`)
  }

  const data = await response.json()

  return {
    heartRate: data.heart_rate?.value ?? 72,
    hrvScore: data.hrv?.score ?? 65,
    stressLevel: data.stress?.level ?? 30,
    respirationRate: data.respiration?.rate ?? 16,
    eyeConcentration: data.eye_concentration?.value ?? 75,
    oxygenSaturation: data.spo2?.value ?? 98,
    fatigueLevel: data.fatigue?.level ?? 20,
    timestamp: Date.now(),
  }
}

/**
 * Derives a full HealthMetrics object from the two signals the C++ binary provides.
 *
 * Heart-rate variability, stress, and fatigue are estimated from the pulse value
 * using well-known physiological heuristics (good enough for demo purposes).
 */
function buildMetricsFromCpp(pulse: number, breathing: number): HealthMetrics {
  // HRV is inversely correlated with heart rate / stress
  const hrvScore = Math.max(20, Math.min(100, Math.round(100 - (pulse - 60) * 0.8)))

  // Stress: elevated if heart rate is high and breathing is fast
  const stressLevel = Math.max(0, Math.min(100,
    Math.round((pulse - 60) * 0.6 + (breathing - 14) * 1.5)
  ))

  // Fatigue: correlates with low HRV and slow breathing
  const fatigueLevel = Math.max(0, Math.min(100,
    Math.round((100 - hrvScore) * 0.5 + (18 - breathing) * 1.5)
  ))

  // Eye concentration: assumed high when stress and fatigue are low
  const eyeConcentration = Math.max(20, Math.min(100,
    Math.round(100 - stressLevel * 0.3 - fatigueLevel * 0.3)
  ))

  // SpO2 stays in the normal range; nudge slightly with breathing rate
  const oxygenSaturation = Math.max(94, Math.min(100,
    Math.round(96 + (breathing - 14) * 0.1)
  ))

  return {
    heartRate: Math.round(pulse),
    hrvScore,
    stressLevel,
    respirationRate: Math.round(breathing),
    eyeConcentration,
    oxygenSaturation,
    fatigueLevel,
    timestamp: Date.now(),
  }
}

function generateMockMetrics(): HealthMetrics {
  const hour = new Date().getHours()
  const isLateNight = hour >= 23 || hour < 6

  return {
    heartRate: 65 + Math.floor(Math.random() * 20),
    hrvScore: isLateNight ? 40 + Math.floor(Math.random() * 20) : 60 + Math.floor(Math.random() * 30),
    stressLevel: isLateNight ? 50 + Math.floor(Math.random() * 30) : 20 + Math.floor(Math.random() * 30),
    respirationRate: 14 + Math.floor(Math.random() * 6),
    eyeConcentration: isLateNight ? 30 + Math.floor(Math.random() * 30) : 60 + Math.floor(Math.random() * 35),
    oxygenSaturation: 96 + Math.floor(Math.random() * 3),
    fatigueLevel: isLateNight ? 60 + Math.floor(Math.random() * 35) : 10 + Math.floor(Math.random() * 30),
    timestamp: Date.now(),
  }
}
