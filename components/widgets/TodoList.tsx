'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Draggable from 'react-draggable'
import { X, Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react'

interface Todo { id: string; text: string; done: boolean }

export default function TodoList({ onClose, onTodosChange }: { onClose: () => void; onTodosChange?: (todos: string[]) => void }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const nodeRef = useRef<HTMLDivElement>(null)

  const add = () => {
    const text = input.trim()
    if (!text) return
    const next = [...todos, { id: crypto.randomUUID(), text, done: false }]
    setTodos(next)
    onTodosChange?.(next.filter(t => !t.done).map(t => t.text))
    setInput('')
  }

  const toggle = (id: string) => {
    const next = todos.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTodos(next)
    onTodosChange?.(next.filter(t => !t.done).map(t => t.text))
  }

  const remove = (id: string) => {
    const next = todos.filter(t => t.id !== id)
    setTodos(next)
    onTodosChange?.(next.filter(t => !t.done).map(t => t.text))
  }

  return (
    <Draggable nodeRef={nodeRef as React.RefObject<HTMLElement>} handle=".drag-handle" defaultPosition={{ x: 340, y: 140 }}>
      <div ref={nodeRef} className="absolute">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          className="glass rounded-2xl border border-white/10 w-[260px]">
          <div className="drag-handle flex items-center justify-between px-4 py-3 border-b border-white/10 cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-semibold text-white/60">To-Do</span>
              <span className="text-[10px] text-white/30">{todos.filter(t => !t.done).length} left</span>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60"><X className="w-3 h-3" /></button>
          </div>

          <div className="max-h-[220px] overflow-y-auto">
            <AnimatePresence>
              {todos.map(todo => (
                <motion.div key={todo.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 group">
                  <button onClick={() => toggle(todo.id)}>
                    {todo.done
                      ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                      : <Circle className="w-4 h-4 text-white/20" />}
                  </button>
                  <span className={`flex-1 text-xs ${todo.done ? 'line-through text-white/25' : 'text-white/80'}`}>{todo.text}</span>
                  <button onClick={() => remove(todo.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3 text-white/25 hover:text-red-400" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {todos.length === 0 && (
              <p className="text-center text-[11px] text-white/20 py-6">No tasks yet</p>
            )}
          </div>

          <div className="border-t border-white/10 px-3 py-2 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="Add a task..."
              className="flex-1 bg-transparent text-xs text-white placeholder-white/20 outline-none" />
            <button onClick={add} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </Draggable>
  )
}
