import { useRef } from 'react'

export function PageActions({ children, className = '' }) {
  if (!children) return null
  return <div className={`df-page-actions ${className}`.trim()}>{children}</div>
}

export function PageHeader({
  kicker,
  title,
  description,
  meta,
  actions,
  actionsClassName = '',
  className = '',
  variant = 'standard',
}) {
  return (
    <header className={`df-page-header df-page-header-${variant} ${className}`.trim()}>
      <div className="df-page-header-copy">
        {kicker ? <span className="df-page-kicker">{kicker}</span> : null}
        {title ? <h1>{title}</h1> : null}
        {description ? <p>{description}</p> : null}
        {meta ? <small>{meta}</small> : null}
      </div>
      {actions ? <PageActions className={actionsClassName}>{actions}</PageActions> : null}
    </header>
  )
}

export function ExportMenu({ options = [], disabled = false, className = '' }) {
  const detailsRef = useRef(null)
  const opcoesDisponiveis = options.filter(Boolean)

  function executarOpcao(opcao) {
    if (disabled || opcao.disabled) return
    opcao.onSelect?.()
    detailsRef.current?.removeAttribute('open')
  }

  if (!opcoesDisponiveis.length) return null

  return (
    <details ref={detailsRef} className={`df-export-menu ${className}`.trim()}>
      <summary
        aria-label="Abrir opções de exportação"
        aria-disabled={disabled || undefined}
        onClick={(event) => { if (disabled) event.preventDefault() }}
      >
        Exportar
      </summary>
      <div className="df-export-menu-options" role="group" aria-label="Formatos de exportação">
        {opcoesDisponiveis.map((opcao) => (
          <button
            key={opcao.id || opcao.label}
            type="button"
            onClick={() => executarOpcao(opcao)}
            disabled={disabled || opcao.disabled}
          >
            {opcao.label}
          </button>
        ))}
      </div>
    </details>
  )
}

export function SectionCard({ title, description, actions, children, className = '', ...props }) {
  return (
    <section className={`df-section-card ${className}`.trim()} {...props}>
      {(title || description || actions) ? (
        <header className="df-section-card-header">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <PageActions>{actions}</PageActions> : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}

export function FilterCard({ description, actions, children, className = '', ...props }) {
  return (
    <SectionCard
      title="Filtros"
      description={description || 'Refine os resultados sem alterar a fonte de dados.'}
      actions={actions}
      className={`df-filter-card ${className}`.trim()}
      {...props}
    >
      {children}
    </SectionCard>
  )
}

export function FilterGrid({ children, secondary = false, className = '', ...props }) {
  return <div className={`df-filter-grid ${secondary ? 'is-secondary' : ''} ${className}`.trim()} {...props}>{children}</div>
}

export function DataTableRegion({ label, hint = 'No celular, deslize somente esta região para ver todas as colunas.', children, className = '' }) {
  return (
    <div className={`df-data-region ${className}`.trim()}>
      <p className="df-data-region-hint">{hint}</p>
      <div className="df-data-region-scroll" role="region" aria-label={label} tabIndex="0">{children}</div>
    </div>
  )
}

export function PageState({ type = 'empty', title, description, actionLabel, onAction, className = '' }) {
  const role = type === 'error' ? 'alert' : 'status'
  return (
    <section className={`df-page-state is-${type} ${className}`.trim()} role={role} aria-busy={type === 'loading' || undefined}>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {actionLabel && onAction ? <button type="button" onClick={onAction}>{actionLabel}</button> : null}
    </section>
  )
}
