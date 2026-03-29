const STATS_KEY = 'studistic_stats'

interface Stats {
  minutesStudied: number
  tasksCompleted: number
  totalTasksAdded: number
  streak: number
  lastStudyDate: string
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function load(): Stats {
  if (typeof window === 'undefined') {
    return { minutesStudied: 0, tasksCompleted: 0, totalTasksAdded: 0, streak: 0, lastStudyDate: '' }
  }
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (raw) return { minutesStudied: 0, tasksCompleted: 0, totalTasksAdded: 0, streak: 0, lastStudyDate: '', ...JSON.parse(raw) }
  } catch {}
  return { minutesStudied: 0, tasksCompleted: 0, totalTasksAdded: 0, streak: 0, lastStudyDate: '' }
}

function save(s: Stats): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STATS_KEY, JSON.stringify(s))
}

function touchStreak(s: Stats): void {
  const today = todayStr()
  if (s.lastStudyDate === today) return
  const prev = new Date(today)
  prev.setDate(prev.getDate() - 1)
  const yesterday = prev.toISOString().slice(0, 10)
  s.streak = s.lastStudyDate === yesterday ? s.streak + 1 : 1
  s.lastStudyDate = today
}

export function getPublicStats() {
  const s = load()
  return {
    hoursStudied: Math.floor(s.minutesStudied / 60),
    tasksCompleted: s.tasksCompleted,
    totalTasksAdded: s.totalTasksAdded,
    streak: s.streak,
  }
}

export function addStudyMinutes(minutes: number): void {
  const s = load()
  s.minutesStudied += minutes
  touchStreak(s)
  save(s)
}

export function addCompletedTask(): void {
  const s = load()
  s.tasksCompleted += 1
  touchStreak(s)
  save(s)
}

export function addTaskAdded(): void {
  const s = load()
  s.totalTasksAdded += 1
  touchStreak(s)
  save(s)
}
