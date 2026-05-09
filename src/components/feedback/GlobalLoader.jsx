export default function GlobalLoader({ visible, message = 'Carregando...' }) {
  if (!visible) return null;

  return (
    <div className="global-loader-overlay" role="status" aria-live="polite">
      <div className="global-loader-card">
        <div className="global-loader-spinner" />
        <span>{message}</span>
      </div>
    </div>
  );
}
