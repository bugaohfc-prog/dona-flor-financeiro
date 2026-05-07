export default function UserSecurityCards({
  novoEmailUsuario,
  setNovoEmailUsuario,
  novaSenhaUsuario,
  setNovaSenhaUsuario,
  confirmarNovaSenhaUsuario,
  setConfirmarNovaSenhaUsuario,
  salvarMeuEmail,
  salvarMinhaSenha,
  styles
}) {
  return (
    <div className="users-account-grid users-security-grid">
      <div className="users-form-card users-security-card">
        <div className="users-security-card-header">
          <strong>Alterar e-mail</strong>
          <small style={styles.textoAjuda}>Confirmação pode ser solicitada.</small>
        </div>
        <input
          style={styles.input}
          type="email"
          placeholder="Novo e-mail"
          value={novoEmailUsuario}
          onChange={(e) => setNovoEmailUsuario(e.target.value)}
        />
        <button style={styles.btnSalvar} onClick={salvarMeuEmail}>Atualizar e-mail</button>
      </div>

      <div className="users-form-card users-security-card">
        <div className="users-security-card-header">
          <strong>Alterar senha</strong>
          <small style={styles.textoAjuda}>Mínimo de 6 caracteres.</small>
        </div>
        <div className="users-security-password-grid">
          <input
            style={styles.input}
            type="password"
            placeholder="Nova senha"
            value={novaSenhaUsuario}
            onChange={(e) => setNovaSenhaUsuario(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmarNovaSenhaUsuario}
            onChange={(e) => setConfirmarNovaSenhaUsuario(e.target.value)}
          />
        </div>
        <button style={styles.btnSalvar} onClick={salvarMinhaSenha}>Atualizar senha</button>
      </div>
    </div>
  )
}
