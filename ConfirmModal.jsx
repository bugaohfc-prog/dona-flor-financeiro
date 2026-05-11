export function SkeletonBox({ className = '', style = {} }) {
  return <div className={`df-skeleton ${className}`.trim()} style={style} aria-hidden="true" />
}

export function SummarySkeleton({ items = 4 }) {
  return (
    <div className="summary-grid df-skeleton-summary" aria-label="Carregando resumo">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="df-skeleton-card df-skeleton-summary-card">
          <SkeletonBox className="df-skeleton-line df-skeleton-line-sm" />
          <SkeletonBox className="df-skeleton-line df-skeleton-line-lg" />
        </div>
      ))}
    </div>
  )
}

export function AccountListSkeleton({ items = 3 }) {
  return (
    <div className="df-skeleton-list" aria-label="Carregando contas">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="df-skeleton-card df-skeleton-account-card">
          <div className="df-skeleton-card-top">
            <SkeletonBox className="df-skeleton-line df-skeleton-line-title" />
            <SkeletonBox className="df-skeleton-line df-skeleton-line-value" />
          </div>
          <div className="df-skeleton-chip-row">
            <SkeletonBox className="df-skeleton-chip" />
            <SkeletonBox className="df-skeleton-chip" />
            <SkeletonBox className="df-skeleton-chip" />
          </div>
          <div className="df-skeleton-actions-row">
            <SkeletonBox className="df-skeleton-button" />
            <SkeletonBox className="df-skeleton-button" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function NotesSkeleton({ items = 3 }) {
  return (
    <div className="notes-page-grid df-skeleton-notes" aria-label="Carregando notas">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="df-skeleton-card df-skeleton-note-card">
          <div className="df-skeleton-card-top">
            <SkeletonBox className="df-skeleton-line df-skeleton-line-title" />
            <SkeletonBox className="df-skeleton-pill" />
          </div>
          <SkeletonBox className="df-skeleton-line df-skeleton-line-sm" />
          <SkeletonBox className="df-skeleton-line df-skeleton-line-full" />
          <SkeletonBox className="df-skeleton-line df-skeleton-line-mid" />
        </div>
      ))}
    </div>
  )
}
