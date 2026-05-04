# Marco Zero SaaS — Correções de Segurança e Usuários

## Ajustes aplicados

- Vínculo automático do usuário no login com `supabase.rpc('vincular_usuario_logado')`.
- Vínculo automático também na carga inicial da sessão, antes de buscar a empresa do usuário.
- Confirmação antes de alterar perfil de usuário.
- Confirmação já existente para remover usuário preservada.
- Bloqueio para remover o próprio acesso.
- Bloqueio para remover o último admin da empresa.
- Bloqueio para rebaixar o último admin da empresa.
- Expiração de sessão por segurança:
  - 8 horas de duração máxima.
  - 30 minutos de inatividade.
  - aviso aos 25 minutos de inatividade.
- Limpeza da sessão segura no logout.

## Observação

Esta versão mantém o app funcional e não faz refatoração pesada do `App.jsx` ainda. A próxima etapa recomendada é iniciar o Painel Master e separar hooks/services por domínio.
