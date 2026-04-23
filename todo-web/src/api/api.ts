import type { Task, TaskInput, Category } from '@/types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:9090'
const TOKEN_KEY = 'todo_token'

type OnUnauthorized = () => void
let onUnauthorizedCallback: OnUnauthorized | null = null

export function setUnauthorizedHandler(cb: OnUnauthorized) {
  onUnauthorizedCallback = cb
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    onUnauthorizedCallback?.()
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const body = await res.json() as { error?: string }
      if (body.error) message = body.error
    } catch {
      // ignore parse error
    }
    throw new Error(message)
  }

  if (res.status === 204) {
    return undefined as unknown as T
  }

  return res.json() as Promise<T>
}

export const auth = {
  login: (email: string, password: string) =>
    request<{ token: string; expires_at: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    request<void>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),
}

export interface TaskQueryParams {
  status?: 'all' | 'complete' | 'incomplete'
  category_id?: string
  due_from?: string
  due_to?: string
}

export const tasks = {
  list: (params: TaskQueryParams = {}) => {
    const q = new URLSearchParams()
    if (params.status && params.status !== 'all') q.set('status', params.status)
    if (params.category_id) q.set('category_id', params.category_id)
    if (params.due_from) q.set('due_from', params.due_from)
    if (params.due_to) q.set('due_to', params.due_to)
    const qs = q.toString()
    return request<Task[]>(`/tasks${qs ? `?${qs}` : ''}`)
  },

  create: (data: TaskInput) =>
    request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: TaskInput) =>
    request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggle: (id: string) =>
    request<Task>(`/tasks/${id}/toggle`, { method: 'PATCH' }),

  delete: (id: string) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE' }),
}

export const categories = {
  list: () => request<Category[]>('/categories'),

  create: (name: string) =>
    request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  rename: (id: string, name: string) =>
    request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  delete: (id: string) =>
    request<void>(`/categories/${id}`, { method: 'DELETE' }),
}
