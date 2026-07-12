export default function PageHero({ kicker, title, description, actions, actionsClassName = '', variant = 'standard', className = '' }) {
  return (
    <header className={`df-page-hero df-page-hero-${variant} ${className}`.trim()}>
      <div className="df-page-hero-copy">
        {kicker && <span className="df-page-hero-kicker">{kicker}</span>}
        {title && <h1>{title}</h1>}
        {description && <p>{description}</p>}
      </div>
      {actions && <div className={`df-page-hero-actions ${actionsClassName}`.trim()}>{actions}</div>}
    </header>
  )
}