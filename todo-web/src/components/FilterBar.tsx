import { Filter, X } from 'lucide-react'
import type { Category, TaskFilters } from '@/types'

interface FilterBarProps {
  filters: TaskFilters
  categories: Category[]
  onChange: (filters: TaskFilters) => void
  onClear: () => void
}

export function FilterBar({ filters, categories, onChange, onClear }: FilterBarProps) {
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.category_id !== '' ||
    filters.due_from !== '' ||
    filters.due_to !== ''

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label htmlFor="f-status" className="block text-xs font-medium text-gray-600 mb-1">
            Status
          </label>
          <select
            id="f-status"
            value={filters.status}
            onChange={e => onChange({ ...filters, status: e.target.value as TaskFilters['status'] })}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="all">All</option>
            <option value="incomplete">Incomplete</option>
            <option value="complete">Complete</option>
          </select>
        </div>

        <div>
          <label htmlFor="f-cat" className="block text-xs font-medium text-gray-600 mb-1">
            Category
          </label>
          <select
            id="f-cat"
            value={filters.category_id}
            onChange={e => onChange({ ...filters, category_id: e.target.value })}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-from" className="block text-xs font-medium text-gray-600 mb-1">
            Due From
          </label>
          <input
            id="f-from"
            type="date"
            value={filters.due_from}
            onChange={e => onChange({ ...filters, due_from: e.target.value })}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="f-to" className="block text-xs font-medium text-gray-600 mb-1">
            Due To
          </label>
          <input
            id="f-to"
            type="date"
            value={filters.due_to}
            onChange={e => onChange({ ...filters, due_to: e.target.value })}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )
}
