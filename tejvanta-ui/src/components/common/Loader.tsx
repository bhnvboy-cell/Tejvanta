interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export function Loader({ size = 'md', message }: LoaderProps) {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-tej-500 border-t-transparent`} />
      {message && <p className="text-sm text-gray-400">{message}</p>}
    </div>
  )
}
