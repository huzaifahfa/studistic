'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Draggable from 'react-draggable'
import { addCompletedTask, addTaskAdded } from '@/lib/studyStats'
import { addTask as dbAddTask, completeTask as dbCompleteTask, deleteTask as dbDeleteTask, getTasks } from '@/lib/db'

const SALMON = '#c4826e'
const REMINDER_INTERVAL_MS = 30 * 60 * 1000
const CHECK_INTERVAL_MS = 60 * 1000

interface Todo {
  id: string
  text: string
  done: boolean
  addedAt: number
  lastRemindedAt?: number
}

export default function TodoList({ onClose, onTodosChange, uid }: {
  onClose: () => void
  onTodosChange?: (todos: string[]) => void
  uid?: string
}) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const [reminder, setReminder] = useState<{ text: string; id: string } | null>(null)
  const nodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!uid) return
    getTasks(uid).then(tasks => {
      const allTasks = tasks.map(t => ({
        id: t.id!,
        text: t.text,
        done: t.completed || false,
        addedAt: Date.now(),
        lastRemindedAt: undefined,
      }))
      setTodos(allTasks)
      onTodosChange?.(allTasks.filter(t => !t.done).map(t => t.text))
    }).catch(console.error)
  }, [uid])

  // Reminder checker — runs every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTodos(prev => {
        const now = Date.now()
        const overdue = prev.find(t =>
          !t.done &&
          now - t.addedAt >= REMINDER_INTERVAL_MS &&
          (!t.lastRemindedAt || now - t.lastRemindedAt >= REMINDER_INTERVAL_MS)
        )
        if (overdue) {
          setReminder({ text: overdue.text, id: overdue.id })
          return prev.map(t => t.id === overdue.id ? { ...t, lastRemindedAt: now } : t)
        }
        return prev
      })
    }, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const add = async () => {
    const text = input.trim()
    if (!text) return
    const tempId = crypto.randomUUID()
    const newTodo: Todo = { id: tempId, text, done: false, addedAt: Date.now() }
    const next = [...todos, newTodo]
    setTodos(next)
    onTodosChange?.(next.filter(t => !t.done).map(t => t.text))
    addTaskAdded(uid)
    setInput('')
    if (uid) {
      const firestoreId = await dbAddTask(uid, text).catch(console.error)
      if (firestoreId) {
        setTodos(prev => prev.map(t => t.id === tempId ? { ...t, id: firestoreId } : t))
      }
    }
  }

  const toggle = (id: string) => {
    const todo = todos.find(t => t.id === id)
    const next = todos.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTodos(next)
    onTodosChange?.(next.filter(t => !t.done).map(t => t.text))
    if (reminder?.id === id) setReminder(null)
    if (todo && !todo.done) {
      addCompletedTask(uid)
      if (uid) dbCompleteTask(uid, id).catch(console.error)
    }
  }

  const remove = (id: string) => {
    const next = todos.filter(t => t.id !== id)
    setTodos(next)
    onTodosChange?.(next.filter(t => !t.done).map(t => t.text))
    if (reminder?.id === id) setReminder(null)
    if (uid) dbDeleteTask(uid, id).catch(console.error)
  }

  return (
    <>
      {/* Reminder popup */}
      <AnimatePresence>
        {reminder && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: 'fixed',
              top: '6.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              backgroundColor: '#fff',
              borderRadius: '1rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              padding: '1rem 1.5rem',
              minWidth: 300,
              maxWidth: 380,
              borderTop: `4px solid ${SALMON}`,
              fontFamily: 'var(--font-nunito), sans-serif',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.4rem' }}>⏰</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, color: SALMON, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  Task reminder
                </p>
                <p style={{ color: '#555', fontSize: '0.88rem', fontWeight: 600 }}>
                  "{reminder.text}" is still pending!
                </p>
              </div>
              <button
                onClick={() => setReminder(null)}
                style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '1rem', cursor: 'pointer', padding: 0 }}
              >✕</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button
                onClick={() => { toggle(reminder.id); setReminder(null) }}
                style={{
                  flex: 1, padding: '0.4rem 0',
                  backgroundColor: SALMON, color: '#fff',
                  border: 'none', borderRadius: '0.5rem',
                  fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                  fontFamily: 'var(--font-nunito), sans-serif',
                }}
              >
                Mark done ✓
              </button>
              <button
                onClick={() => setReminder(null)}
                style={{
                  flex: 1, padding: '0.4rem 0',
                  backgroundColor: '#f5ede4', color: SALMON,
                  border: 'none', borderRadius: '0.5rem',
                  fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                  fontFamily: 'var(--font-nunito), sans-serif',
                }}
              >
                Remind later
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main widget */}
      <Draggable nodeRef={nodeRef as React.RefObject<HTMLElement>} handle=".drag-handle" defaultPosition={{ x: 820, y: 170 }}>
        <div ref={nodeRef} className="absolute" style={{ zIndex: 20 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            style={{
              width: 290,
              borderRadius: '1.25rem',
              overflow: 'hidden',
              backgroundColor: '#fff',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              fontFamily: 'var(--font-nunito), sans-serif',
            }}
          >
            {/* Header */}
            <div
              className="drag-handle flex items-center justify-between px-5 py-3 cursor-grab active:cursor-grabbing"
              style={{ borderBottom: `2px solid ${SALMON}` }}
            >
              <span style={{ color: SALMON, fontWeight: 800, fontSize: '1.3rem' }}>Task</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: SALMON, fontWeight: 600, fontSize: '0.85rem' }}>
                  {todos.filter(t => t.done).length} completed
                </span>
                <button
                  onClick={onClose}
                  style={{ color: SALMON, fontWeight: 700, fontSize: '1.1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tasks list */}
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              <AnimatePresence>
                {todos.map(todo => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.6rem 1.25rem',
                      borderBottom: '1px solid #f5ede4',
                      backgroundColor: reminder?.id === todo.id ? '#fff8f5' : 'transparent',
                      transition: 'background 0.3s',
                    }}
                  >
                    <button
                      onClick={() => toggle(todo.id)}
                      style={{
                        width: '1.1rem', height: '1.1rem', minWidth: '1.1rem',
                        border: `2px solid ${SALMON}`, borderRadius: '0.25rem',
                        backgroundColor: todo.done ? SALMON : 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', transition: 'all 0.3s ease',
                      }}
                    >
                      {todo.done && <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>✓</span>}
                    </button>
                    <span
                      style={{
                        flex: 1, fontSize: '0.9rem', fontWeight: 600,
                        color: todo.done ? '#999' : SALMON,
                        textDecoration: todo.done ? 'line-through' : 'none',
                        cursor: 'pointer', transition: 'all 0.3s ease',
                      }}
                      onClick={() => toggle(todo.id)}
                    >
                      {todo.text}
                      {reminder?.id === todo.id && (
                        <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem' }}>⏰</span>
                      )}
                    </span>
                    <button
                      onClick={() => remove(todo.id)}
                      style={{
                        background: 'none', border: 'none', color: SALMON,
                        fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      −
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {todos.length === 0 && (
                <p style={{ textAlign: 'center', color: '#ddd', fontSize: '0.82rem', padding: '1.5rem 0' }}>
                  No tasks yet
                </p>
              )}
            </div>

            {/* Add task row */}
            <div style={{
              borderTop: `1px solid #f5ede4`, padding: '0.6rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && add()}
                placeholder="Add new task +"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-nunito), sans-serif',
                  fontWeight: 600, fontSize: '0.88rem', color: SALMON,
                }}
              />
            </div>
          </motion.div>
        </div>
      </Draggable>
    </>
  )
}