export default function GlobalToast({ toast, onClose }) {
  if (!toast) return null;

  const tipo = toast.type || 'info';

  return (
    <div
      className={`app-toast app-toast-${tipo} app-toast-global ${toast.isClosing ? 'app-toast-saindo' : ''}`}
      style={{ '--toast-duration': `${toast.duration || 3600}ms` }}
      role={tipo === 'erro' ? 'alert' : 'status'}
      aria-live={tipo === 'erro' ? 'assertive' : 'polite'}
      onClick={onClose}
    >
      <div className={`app-toast-icon app-toast-icon-${tipo}`}>
        {tipo === 'erro' ? '!' : tipo === 'sucesso' ? '✓' : tipo === 'alerta' ? '!' : 'i'}
      </div>
      <div className="app-toast-content">
        <strong>{toast.title || (tipo === 'erro' ? 'Atenção' : 'Aviso')}</strong>
        <span>{toast.message}</span>
      </div>
      <button type="button" className="app-toast-close" aria-label="Fechar aviso">×</button>
      <div className="app-toast-progress" aria-hidden="true" />
    </div>
  );
}
