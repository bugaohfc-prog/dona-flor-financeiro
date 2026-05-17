import AccountModal from '../modals/AccountModal.jsx'
import NoteModal from '../modals/NoteModal.jsx'
import CostCenterModal from '../modals/CostCenterModal.jsx'
import ProfileModal from '../modals/ProfileModal.jsx'

export default function AppModalsLayer({
  styles,
  modalConta,
  contaProps,
  modalNota,
  notaProps,
  modalCentro,
  centroProps,
  modalPerfilUsuario,
  perfilProps
}) {
  return (
    <>
      {modalConta && <AccountModal styles={styles} {...contaProps} />}
      {modalNota && <NoteModal styles={styles} {...notaProps} />}
      {modalCentro && <CostCenterModal styles={styles} {...centroProps} />}
      {modalPerfilUsuario && <ProfileModal {...perfilProps} />}
    </>
  )
}
