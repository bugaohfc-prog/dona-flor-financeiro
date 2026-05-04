# Marco Zero consolidado — Usuários, Auth, layout e notas

Esta versão consolida as correções de segurança/usuários com a evolução de layout/menu/notas.

## Incluído

- Menu desktop refatorado e mobile preservado.
- Módulo dedicado de Notas.
- Confirmação para alteração de perfil.
- Confirmação para remoção de usuário.
- Proteção contra remoção do próprio acesso.
- Proteção contra remoção/rebaixamento do último admin.
- Expiração de sessão.
- Vínculo automático no login via `vincular_usuario_logado`.
- Botão `Enviar acesso` para usuário.
- Serviço preparado para Edge Function `convidar-usuario`.
- Fallback para reset de senha quando a Edge Function ainda não estiver publicada.
- Deduplicação visual de usuários na listagem.

## Supabase

Rodar o SQL opcional de limpeza:

`supabase/sql/2026-05-04_limpeza_usuarios_duplicados.sql`

Para convite real de usuário novo, publicar a Edge Function:

`supabase/functions/convidar-usuario/index.ts`

Sem a Edge Function publicada, o botão `Enviar acesso` solicita reset para usuários que já existem no Supabase Auth.
