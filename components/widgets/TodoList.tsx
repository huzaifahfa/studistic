'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Draggable from 'react-draggable'
import { addCompletedTask, addTaskAdded } from '@/lib/studyStats'

const SALMON = '#c4826e'

interface Todo { id: string; text: string; done: boolean }

const TODOS_KEY = 'studistic_todos'

export default function TodoList({ onClose, onTodosChange }: { onClose: () => void; onTodosChange?: (todos: string[]) => void }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const nodeRef = useRef<HTMLDivElement>(null)

  // Load todos from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(TODOS_KEY)
        if (saved) {
          const parsedTodos = JSON.parse(saved)
          setTodos(parsedTodos)
          onTodosChange?.(parsedTodos.filter((t: Todo) => !t.done).map((t: Todo) => t.text))
        }
      } catch (error) {
        console.error('Failed to load todos from localStorage:', error)
      }
    }
  }, [])

  // Save todos to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(TODOS_KEY, JSON.stringify(todos))
      } catch (error) {
        console.error('Failed to save todos to localStorage:', error)
      }
    }
  }, [todos])

  const add = () => {
    const text = input.trim()
    if (!text) return
    const next = [...todos, { id: crypto.randomUUID(), text, done: false }]
    setTodos(next)
    onTodosChange?.(next.filter(t => !t.done).map(t => t.text))
    addTaskAdded()
    setInput('')
  }

  const toggle = (id: string) => {
    const todo = todos.find(t => t.id === id)
    const next = todos.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTodos(next)
    onTodosChange?.(next.filter(t => !t.done).map(t => t.text))
    if (todo && !todo.done) addCompletedTask()
  }

  const remove = (id: string) => {
    const next = todos.filter(t => t.id !== id)
    setTodos(next)
    onTodosChange?.(next.filter(t => !t.done).map(t => t.text))
  }

  return (
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
                    justifyContent: 'space-between',
                    padding: '0.6rem 1.25rem',
                    borderBottom: '1px solid #f5ede4',
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: todo.done ? '#bbb' : SALMON,
                      textDecoration: todo.done ? 'line-through' : 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggle(todo.id)}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => remove(todo.id)}
                    style={{
                      marginLeft: '0.5rem',
                      background: 'none',
                      border: `1px solid ${SALMON}`,
                      borderRadius: '0.4rem',
                      padding: '0.15rem 0.45rem',
                      color: SALMON,
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    /
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
          <div
            style={{
              borderTop: `1px solid #f5ede4`,
              padding: '0.6rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="Add new task +"
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-nunito), sans-serif',
                fontWeight: 600,
                fontSize: '0.88rem',
                color: SALMON,
              }}
            />
          </div>
        </motion.div>
      </div>
    </Draggable>
  )
}
