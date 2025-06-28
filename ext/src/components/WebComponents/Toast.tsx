import { useState } from "react"

export type ToastType = "success" | "danger" | "warning"

interface ToastProps {
  type: ToastType
  message: string
  onClose: () => void
}

const iconMap = {
  success: {
    bgColor: "bg-green-50 dark:bg-green-900/20",
    iconColor: "text-green-600 dark:text-green-400",
    textColor: "text-green-800 dark:text-green-200",
    borderColor: "border-green-200 dark:border-green-800",
    path: "M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.5 9.5 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"
  },
  danger: {
    bgColor: "bg-red-50 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
    textColor: "text-red-800 dark:text-red-200",
    borderColor: "border-red-200 dark:border-red-800",
    path: "M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.5 9.5 0 0 0 10 .5ZM13.707 12.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"
  },
  warning: {
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    textColor: "text-yellow-800 dark:text-yellow-200",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    path: "M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.5 9.5 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"
  }
}

export const Toast = ({ type, message, onClose }: ToastProps) => {
  const { bgColor, iconColor, textColor, borderColor, path } = iconMap[type]

  return (
    <div className={`flex items-center w-full max-w-sm px-4 py-2 rounded-lg border shadow-lg backdrop-blur-sm ${bgColor} ${borderColor} animate-in slide-in-from-right-full duration-300`}>
      <div className={`inline-flex items-center justify-center shrink-0 w-8 h-8 rounded-full ${iconColor}`}>
        <svg
          className="w-5 h-5"
          aria-hidden="true"
          fill="currentColor"
          viewBox="0 0 20 20">
          <path d={path} />
        </svg>
        <span className="sr-only">Icon</span>
      </div>
      <div className={`ms-3 text-sm font-medium ${textColor} flex-1`}>{message}</div>
      <button
        type="button"
        onClick={onClose}
        className={`ms-auto rounded-lg focus:ring-2 ml-3 focus:ring-offset-2 p-1.5 inline-flex items-center justify-center h-8 w-8 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${textColor} focus:ring-current/20`}
        aria-label="Close">
        <span className="sr-only">Close</span>
        <svg
          className="w-3 h-3"
          aria-hidden="true"
          fill="none"
          viewBox="0 0 14 14">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
          />
        </svg>
      </button>
    </div>
  )
}

let addToast: (type: ToastType, message: string) => void

export const ToastManager = () => {
  const [toasts, setToasts] = useState<
    { id: number; type: ToastType; message: string }[]
  >([])

  addToast = (type, message) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000) // Changed from 100000ms to 5000ms (5 seconds)
  }

  return (
    <div className="fixed top-4 right-4 z-[99999] space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() =>
            setToasts((prev) => prev.filter((t) => t.id !== toast.id))
          }
        />
      ))}
    </div>
  )
}

export const showToast = (type: ToastType, message: string) => {
  addToast?.(type, message)
}