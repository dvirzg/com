const Skeleton = ({ className = '', variant = 'text', width, height }) => {
  const baseClasses = 'animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded'
  
  const variants = {
    text: 'h-4 w-full',
    title: 'h-8 w-3/4',
    circle: 'rounded-full',
    rectangle: '',
    card: 'h-32 w-full',
  }
  
  const variantClass = variants[variant] || variants.text
  
  const style = {}
  if (width) style.width = width
  if (height) style.height = height
  
  return (
    <div 
      className={`${baseClasses} ${variantClass} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} variant="text" className={i === lines - 1 ? 'w-2/3' : ''} />
    ))}
  </div>
)

export const SkeletonCard = ({ className = '' }) => (
  <div className={`border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 ${className}`}>
    <Skeleton variant="title" className="mb-3" />
    <SkeletonText lines={2} />
  </div>
)

export const SkeletonList = ({ items = 3, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
)

export default Skeleton
