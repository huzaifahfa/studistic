'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, CheckCircle2, Circle, Flag } from 'lucide-react'
import Widget from './Widget'

type Priority = 'low' | 'medium' | 'high'
type Filter = 'all' | 'active' | 'done'

interface Todo {
  id: string
  text: string
  done: boolean
  priority: Priority
  createdAt: number
}

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-zinc-400', dot: 'bg-zinc-500' },
  medium: { label: 'Med', color: 'text-amber-400', dot: 'bg-amber-500' },
  high: { label: 'High', color: 'text-red-400', dot: 'bg-red-500' },
}

interface TodoListProps {
  onClose?: () => void
  defaultPosition?: { x: number; y: number }
}

export default function TodoList({ onClose, defaultPosition }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem('studyspace-todos') || '[]')
    } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [filter, setFilter] = useState<Filter>('all')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem('studyspace-todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    const text = input.trim()
    if (!text) return
    setTodos((prev) => [
      { id: `${Date.now()}`, text, done: false, priority, createdAt: Date.now() },
      ...prev,
    ])
    setInput('')
  }

  const toggleTodo = (id: string) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const deleteTodo = (id: string) => setTodos((prev) => prev.filter((t) => t.id !== id))

  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.done
    if (filter === 'done') return t.done
    return true
  })

  const activeCount = todos.filter((t) => !t.done).length

  return (
    <Widget
      title="To-Do List"
      onClose={onClose}
      defaultPosition={defaultPosition || { x: 420, y: 140 }}
      minWidth={300}
      accentColor="#22c55e"
    >
      <div className="w-full" style={{ minWidth: 280, maxHeight: 420 }}>
        {/* Input */}
        <div className="flex gap-2 mb-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Add a task..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
          />
          <div className="flex gap-1">
            {(['low', 'medium', 'high'] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                title={PRIORITY_CONFIG[p].label}
                className={`p-2 rounded-lg transition-all ${
                  priority === p ? `bg-white/10 border border-white/20` : 'hover:bg-white/5'
                }`}
              >
                <Flag className={`w-3 h-3 ${PRIORITY_CONFIG[p].color}`} />
              </button>
            ))}
            <button
              onClick={addTodo}
              className="p-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-3">
          {(['all', 'active', 'done'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Count */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/30">{activeCount} task{activeCount !== 1 ? 's' : ''} remaining</span>
          {todos.filter((t) => t.done).length > 0 && (
            <button
              onClick={() => setTodos((prev) => prev.filter((t) => !t.done))}
              className="text-xs text-white/30 hover:text-red-400 transition-colors"
            >
              Clear done
            </button>
          )}
        </div>

        {/* Todos */}
        <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 240 }}>
          <AnimatePresence initial={false}>
            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center text-white/20 text-sm"
              >
                {filter === 'done' ? 'No completed tasks yet' : 'All clear! Add a task above.'}
              </motion.div>
            )}
            {filtered.map((todo) => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.18 }}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all group ${
                  todo.done
                    ? 'bg-white/3 border-white/5 opacity-60'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <button onClick={() => toggleTodo(todo.id)} className="flex-shrink-0">
                  {todo.done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-white/30 hover:text-green-400 transition-colors" />
                  )}
                </button>
                <span className={`flex-1 text-sm ${todo.done ? 'line-through text-white/30' : 'text-white/80'}`}>
                  {todo.text}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_CONFIG[todo.priority].dot}`} />
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Widget>
  )
}
