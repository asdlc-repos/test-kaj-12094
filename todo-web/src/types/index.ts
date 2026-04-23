export interface User {
  id: string
  email: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string
  category_id: string | null
  due_date: string | null
  completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface TaskInput {
  title: string
  description?: string
  category_id?: string | null
  due_date?: string | null
}

export interface Category {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface TaskFilters {
  status: 'all' | 'complete' | 'incomplete'
  category_id: string
  due_from: string
  due_to: string
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}
