interface Props {
  width?: string
  height?: string
  radius?: string
  className?: string
}

export function Skeleton({ width = '100%', height = '16px', radius = '8px', className = '' }: Props) {
  return <span className={`skeleton ${className}`.trim()} style={{ width, height, borderRadius: radius }} />
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-cards">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <Skeleton width="45%" height="12px" />
          <Skeleton width="70%" height="26px" />
        </div>
      ))}
    </div>
  )
}
