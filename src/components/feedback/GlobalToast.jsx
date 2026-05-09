export default function GlobalToast({ toast }) {
  if (!toast) return null;

  return (
    <div className={`global-toast ${toast.type || 'success'}`}>
      {toast.message}
    </div>
  );
}
