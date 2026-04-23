import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Tag, Edit2, Check, X, Trash2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useCategories } from '@/hooks/useCategories'
import { useToast } from '@/context/ToastContext'
import type { Category } from '@/types'

export function CategoryPage() {
  const { categoryList, loading, error, fetchCategories, createCategory, renameCategory, deleteCategory } = useCategories()
  const { showToast } = useToast()

  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [addLoading, setAddLoading] = useState(false)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const [renameLoading, setRenameLoading] = useState(false)

  const [deletingCat, setDeletingCat] = useState<Category | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    void fetchCategories()
  }, [fetchCategories])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) {
      setAddError('Category name cannot be empty.')
      return
    }
    setAddError(null)
    setAddLoading(true)
    try {
      await createCategory(name)
      setNewName('')
      showToast(`Category "${name}" created`, 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create category'
      setAddError(msg)
    } finally {
      setAddLoading(false)
    }
  }

  const startRename = (cat: Category) => {
    setRenamingId(cat.id)
    setRenameValue(cat.name)
    setRenameError(null)
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameValue('')
    setRenameError(null)
  }

  const handleRename = async (id: string) => {
    const name = renameValue.trim()
    if (!name) {
      setRenameError('Name cannot be empty.')
      return
    }
    setRenameError(null)
    setRenameLoading(true)
    try {
      await renameCategory(id, name)
      setRenamingId(null)
      showToast(`Category renamed to "${name}"`, 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to rename category'
      setRenameError(msg)
    } finally {
      setRenameLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingCat) return
    setDeleteLoading(true)
    try {
      await deleteCategory(deletingCat.id)
      showToast(`Category "${deletingCat.name}" deleted`, 'success')
      setDeletingCat(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete category', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-primary-600" />
            Category Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Create, rename, and delete your task categories</p>
        </div>

        {/* Add Category */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary-600" />
            Add New Category
          </h2>
          <form onSubmit={handleAdd} className="flex gap-3">
            <div className="flex-1">
              <input
                id="new-cat"
                type="text"
                value={newName}
                onChange={e => { setNewName(e.target.value); setAddError(null) }}
                placeholder="Category name (must be unique)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {addError && (
                <p className="text-xs text-red-600 mt-1">{addError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={addLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {addLoading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Category
            </button>
          </form>
        </div>

        {/* Info notice */}
        <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
          <span>ℹ️</span>
          <span>Deleting a category removes it from all associated tasks but does <strong>not</strong> delete those tasks.</span>
        </div>

        {/* Category List */}
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
          </div>
        )}

        {!loading && !error && categoryList.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No categories yet</p>
            <p className="text-sm mt-1">Create your first category above</p>
          </div>
        )}

        <div className="space-y-3">
          {categoryList.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              {renamingId === cat.id ? (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={e => { setRenameValue(e.target.value); setRenameError(null) }}
                      autoFocus
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      onKeyDown={e => {
                        if (e.key === 'Enter') void handleRename(cat.id)
                        if (e.key === 'Escape') cancelRename()
                      }}
                    />
                    <button
                      onClick={() => handleRename(cat.id)}
                      disabled={renameLoading}
                      className="p-1.5 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                      aria-label="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelRename}
                      disabled={renameLoading}
                      className="p-1.5 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      aria-label="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {renameError && <p className="text-xs text-red-600 mt-1">{renameError}</p>}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <Tag className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="font-medium text-gray-900">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startRename(cat)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      Rename
                    </button>
                    <button
                      onClick={() => setDeletingCat(cat)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {categoryList.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Category</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categoryList.map(cat => (
                  <tr key={cat.id}>
                    <td className="px-4 py-2.5 text-gray-600">{cat.name}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400">{new Date(cat.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deletingCat}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${deletingCat?.name}"? All associated tasks will have their category removed, but the tasks themselves will remain intact.`}
        confirmLabel="Yes, Delete Category"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingCat(null)}
        loading={deleteLoading}
      />
    </div>
  )
}
