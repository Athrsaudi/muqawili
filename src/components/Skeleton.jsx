import './Skeleton.css'

export function SkeletonBox({ width = '100%', height = 20, radius = 8, style = {} }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />
  )
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <SkeletonBox height={14} width="40%" radius={20} />
      <SkeletonBox height={18} width="85%" />
      <SkeletonBox height={14} width="30%" />
    </div>
  )
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div style={{ padding: '40px 24px', maxWidth: 960, margin: '0 auto' }}>
      <SkeletonBox height={32} width="40%" style={{ marginBottom: 32 }} />
      <SkeletonGrid count={6} />
    </div>
  )
}
