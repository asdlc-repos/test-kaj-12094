import { useState } from 'react'
import { Calendar, Tag, Edit2, Trash2, Clock } from 'lucide-react'
import clsx from 'clsx'
import type { Task, Category } from '@/types'

interface TaskCardProps {
  task: Task
  categories: Category[]
  today: string
  onEdit: (task: Task) => void
  onToggle: (id: string) => Promise<void>
  onDelete: (task: Task) => void
}

export function TaskCard({ task, categories, today, onEdit, onToggle, onDelete }: TaskCardProps) {
  const [toggling, setToggling] = useState(false)

  const category = categories.find(c => c.id === task.category_id)
  const isOverdue = !task.completed && task.due_date != null && task.due_date < today

  const handleToggle = async () => {
    setToggling(true)
    try {
      await onToggle(task.id)
    } finally {
      setToggling(false)
    }
  }

  const truncated = task.description && task.description.length > 100
    ? task.description.slice(0, 100) + '…'
    : task.description

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border shadow-sm p-4 transition-all hover:shadow-md',
        isOverdue && 'border-l-4 border-l-red-500',
        task.completed && 'opacity-70',
        !isOverdue && !task.completed && 'border-gray-200'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            disabled={toggling}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer disabled:opacity-50"
            aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={clsx(
              'font-semibold text-gray-900 leading-snug',
              task.completed && 'line-through text-gray-500'
            )}>
              {task.title}
              {isOverdue && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  Overdue
                </span>
              )}
              {task.completed && (
                <span className="ml-2 inline-flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  Complete
                </span>
              )}
            </h3>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                aria-label="Edit task"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(task)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {truncated && (
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{truncated}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-2">
            {category && (
              <span className="inline-flex items-center gap-1 text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                <Tag className="w-3 h-3" />
                {category.name}
              </span>
            )}
            {task.due_date && (
              <span className={clsx(
                'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                isOverdue ? 'text-red-700 bg-red-50' : 'text-gray-600 bg-gray-100'
              )}>
                <Calendar className="w-3 h-3" />
                {task.due_date}
              </span>
            )}
            {task.completed && task.completed_at && (
              <span className="text-xs text-gray-400">
                Completed {new Date(task.completed_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
