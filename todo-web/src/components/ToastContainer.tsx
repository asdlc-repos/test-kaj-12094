import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import type { Toast } from '@/types'
import clsx from 'clsx'

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
  }

  return (
    <div
      className={clsx(
        'flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border max-w-sm w-full',
        'bg-white animate-in slide-in-from-right-full',
        toast.type === 'success' && 'border-green-200',
        toast.type === 'error' && 'border-red-200',
        toast.type === 'info' && 'border-blue-200'
      )}
    >
      {icons[toast.type]}
      <p className="text-sm text-gray-700 flex-1 leading-relaxed">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}
