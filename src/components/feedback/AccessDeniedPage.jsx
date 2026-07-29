export default function AccessDeniedPage({
  titulo = 'Acesso restrito',
  mensagem = 'Seu perfil não possui acesso a esta tela.',
  onVoltar,
  styles = {},
}) {
  return (
    <section style={styles.cardConfiguracao} aria-labelledby="access-denied-title">
      <h1 id="access-denied-title" style={styles.titulo}>{titulo}</h1>
      <p style={styles.textoNota}>{mensagem}</p>
      <button type="button" style={styles.btnCinza} onClick={onVoltar}>
        Voltar ao Painel
      </button>
    </section>
  )
}
