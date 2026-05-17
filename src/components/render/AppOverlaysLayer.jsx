import ConfirmModal from '../modals/ConfirmModal.jsx'
import GlobalLoader from '../feedback/GlobalLoader.jsx'
import GlobalToast from '../feedback/GlobalToast.jsx'

export default function AppOverlaysLayer({
  styles,
  globalLoading,
  globalToast,
  hideToast,
  confirmacao,
  fecharConfirmacao,
  executarConfirmacao
}) {
  return (
    <>
      <GlobalLoader visible={globalLoading} />
      <GlobalToast toast={globalToast} onClose={hideToast} />
      <ConfirmModal
        styles={styles}
        confirmacao={confirmacao}
        fecharConfirmacao={fecharConfirmacao}
        executarConfirmacao={executarConfirmacao}
      />
    </>
  )
}
