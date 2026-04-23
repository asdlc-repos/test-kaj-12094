import { useState, useCallback } from 'react'
import { tasks as tasksApi } from '@/api/api'
import type { Task, TaskInput, TaskFilters } from '@/types'

export function useTasks() {
  const [taskList, setTaskList] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async (filters?: Partial<TaskFilters>) => {
    setLoading(true)
    setError(null)
    try {
      const data = await tasksApi.list({
        status: filters?.status,
        category_id: filters?.category_id || undefined,
        due_from: filters?.due_from || undefined,
        due_to: filters?.due_to || undefined,
      })
      setTaskList(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  const createTask = useCallback(async (data: TaskInput): Promise<Task | null> => {
    try {
      const task = await tasksApi.create(data)
      setTaskList(prev => [...prev, task])
      return task
    } catch (e) {
      throw e
    }
  }, [])

  const updateTask = useCallback(async (id: string, data: TaskInput): Promise<Task | null> => {
    try {
      const updated = await tasksApi.update(id, data)
      setTaskList(prev => prev.map(t => t.id === id ? updated : t))
      return updated
    } catch (e) {
      throw e
    }
  }, [])

  const toggleTask = useCallback(async (id: string): Promise<void> => {
    try {
      const updated = await tasksApi.toggle(id)
      setTaskList(prev => prev.map(t => t.id === id ? updated : t))
    } catch (e) {
      throw e
    }
  }, [])

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      await tasksApi.delete(id)
      setTaskList(prev => prev.filter(t => t.id !== id))
    } catch (e) {
      throw e
    }
  }, [])

  return { taskList, loading, error, fetchTasks, createTask, updateTask, toggleTask, deleteTask }
}
