import { PageHeader } from './PagePatterns.jsx'

export default function PageHero({ className = '', variant = 'standard', ...props }) {
  return (
    <PageHeader
      {...props}
      variant={variant}
      className={`df-page-hero df-page-hero-${variant} ${className}`.trim()}
    />
  )
}
