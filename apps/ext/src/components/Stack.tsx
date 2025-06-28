import React from "react"
import clsx from "clsx"

export function Stack({
  children,
  className = ""
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={clsx("flex gap-3", className)}>
      {children}
    </div>
  )
}

Stack.Header = function StackHeader({
  title,
  action
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex justify-between items-center mb-2 px-1">
      <h3 className="text-gray-700 font-medium">{title}</h3>
      {action && action}
    </div>
  )
}
