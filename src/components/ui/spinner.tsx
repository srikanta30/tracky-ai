import { cn } from "@/lib/utils"

interface SpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Spinner({ className, size = "md" }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  )
}

interface LoadingSpinnerProps {
  className?: string
  text?: string
}

export function LoadingSpinner({ className, text = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Spinner className="text-blue-600" />
      <span className="text-sm text-slate-600">{text}</span>
    </div>
  )
}
