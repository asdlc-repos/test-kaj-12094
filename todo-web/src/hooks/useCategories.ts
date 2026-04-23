import { useState, useCallback } from 'react'
import { categories as categoriesApi } from '@/api/api'
import type { Category } from '@/types'

export function useCategories() {
  const [categoryList, setCategoryList] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await categoriesApi.list()
      setCategoryList(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  const createCategory = useCallback(async (name: string): Promise<Category> => {
    const cat = await categoriesApi.create(name)
    setCategoryList(prev => [...prev, cat])
    return cat
  }, [])

  const renameCategory = useCallback(async (id: string, name: string): Promise<void> => {
    const updated = await categoriesApi.rename(id, name)
    setCategoryList(prev => prev.map(c => c.id === id ? updated : c))
  }, [])

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    await categoriesApi.delete(id)
    setCategoryList(prev => prev.filter(c => c.id !== id))
  }, [])

  return { categoryList, loading, error, fetchCategories, createCategory, renameCategory, deleteCategory }
}
