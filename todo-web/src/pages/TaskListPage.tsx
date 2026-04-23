import { useEffect, useState, useMemo } from 'react'
import { Plus, ListTodo } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { TaskCard } from '@/components/TaskCard'
import { TaskForm } from '@/components/TaskForm'
import { FilterBar } from '@/components/FilterBar'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useTasks } from '@/hooks/useTasks'
import { useCategories } from '@/hooks/useCategories'
import { useToast } from '@/context/ToastContext'
import type { Task, TaskFilters, TaskInput } from '@/types'

const DEFAULT_FILTERS: TaskFilters = {
  status: 'all',
  category_id: '',
  due_from: '',
  due_to: '',
}

export function TaskListPage() {
  const { taskList, loading, error, fetchTasks, createTask, updateTask, toggleTask, deleteTask } = useTasks()
  const { categoryList, fetchCategories } = useCategories()
  const { showToast } = useToast()

  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)
  const [editingTask, setEditingTask] = useState<Task | null | undefined>(undefined)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  useEffect(() => {
    void fetchTasks(filters)
    void fetchCategories()
  }, [fetchCategories]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (newFilters: TaskFilters) => {
    setFilters(newFilters)
    void fetchTasks(newFilters)
  }

  const handleFilterClear = () => {
    setFilters(DEFAULT_FILTERS)
    void fetchTasks(DEFAULT_FILTERS)
  }

  const handleAddTask = () => {
    setEditingTask(null)
    setShowForm(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingTask(undefined)
  }

  const handleFormSubmit = async (data: TaskInput) => {
    if (editingTask) {
      await updateTask(editingTask.id, data)
      showToast(`Task "${data.title}" updated successfully`, 'success')
    } else {
      await createTask(data)
      showToast(`Task "${data.title}" created successfully`, 'success')
    }
    setShowForm(false)
    setEditingTask(undefined)
  }

  const handleToggle = async (id: string) => {
    try {
      await toggleTask(id)
      const task = taskList.find(t => t.id === id)
      if (task) {
        showToast(`Task "${task.title}" marked as ${task.completed ? 'incomplete' : 'complete'}`, 'success')
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update task', 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return
    setDeleteLoading(true)
    try {
      await deleteTask(deletingTask.id)
      showToast(`Task "${deletingTask.title}" deleted`, 'success')
      setDeletingTask(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete task', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const overdue = taskList.filter(t => !t.completed && t.due_date != null && t.due_date < today).length
  const completed = taskList.filter(t => t.completed).length
  const upcoming = taskList.filter(t => !t.completed && (t.due_date == null || t.due_date >= today)).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ListTodo className="w-6 h-6 text-primary-600" />
              My Tasks
            </h1>
            {overdue > 0 && (
              <p className="text-sm text-red-600 mt-1">
                {overdue} task{overdue !== 1 ? 's' : ''} overdue
              </p>
            )}
          </div>
          <button
            onClick={handleAddTask}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>

        <FilterBar
          filters={filters}
          categories={categoryList}
          onChange={handleFilterChange}
          onClear={handleFilterClear}
        />

        {showForm && (
          <div className="mt-6">
            <TaskForm
              task={editingTask}
              categories={categoryList}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        <div className="mt-6 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
              <button
                onClick={() => fetchTasks(filters)}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && taskList.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">No tasks found</p>
              <p className="text-sm mt-1">Create your first task to get started</p>
            </div>
          )}

          {!loading && taskList.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              categories={categoryList}
              today={today}
              onEdit={handleEditTask}
              onToggle={handleToggle}
              onDelete={setDeletingTask}
            />
          ))}
        </div>

        {taskList.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Summary</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-4 py-2.5 text-gray-600">Total Tasks</td><td className="px-4 py-2.5 text-right font-medium">{taskList.length}</td></tr>
                <tr><td className="px-4 py-2.5 text-red-600">Overdue</td><td className="px-4 py-2.5 text-right font-medium text-red-600">{overdue}</td></tr>
                <tr><td className="px-4 py-2.5 text-green-600">Completed</td><td className="px-4 py-2.5 text-right font-medium text-green-600">{completed}</td></tr>
                <tr><td className="px-4 py-2.5 text-gray-600">Upcoming</td><td className="px-4 py-2.5 text-right font-medium">{upcoming}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deletingTask}
        title="Delete Task"
        message={`Are you sure you want to delete the task "${deletingTask?.title}"? This action is permanent and cannot be undone.`}
        confirmLabel="Yes, Delete Task"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTask(null)}
        loading={deleteLoading}
      />
    </div>
  )
}
