# Correção de segurança - convidar-usuario com empresaId

Data: 2026-05-21

## Contexto

A Edge Function `convidar-usuario` foi revisada após o hardening de RLS e do saneamento crítico de `df_usuarios_empresas`.

O risco auditado era a autorização administrativa global no envio de convite/link de acesso. Como a função usa chave de serviço no backend, ela precisa validar explicitamente a empresa do fluxo antes de acionar convite ou reset de senha.

## Status

- Homologação: aplicado e validado.
- Produção: pendente de registro neste documento se o deploy produtivo ainda não tiver sido documentado no Git.
- Frontend: fluxo preservado, sem alteração de layout.
- RLS/policies: não alteradas por esta correção.

## Regra atual validada

A função `convidar-usuario` agora exige `empresaId` no body da chamada, junto com `email`, `nome` e `redirectTo`.

A autorização do usuário chamador segue esta regra:

- permitir se `public.is_master()` retornar `true`; ou
- permitir se `public.df_usuario_eh_admin(empresaId)` retornar `true`.

A função não deve usar `public.is_admin()` global neste fluxo.

## Validação do alvo

Antes de enviar convite ou reset, a função valida que o e-mail alvo está vinculado à empresa informada em `public.df_usuarios_empresas`.

Isso impede que um admin de uma empresa use o fluxo para acionar convite/link de acesso para usuário fora da própria empresa.

Master pode enviar link para usuários de qualquer empresa, mas sempre com `empresaId` explícito e com vínculo do e-mail alvo naquela empresa.

## Anti-enumeração

A resposta ao frontend deve permanecer genérica:

```text
Envio solicitado. Se o usuário estiver apto, receberá o link por e-mail.
```

O frontend não deve receber detalhes sobre:

- existência ou ausência do e-mail no Auth;
- existência ou ausência do vínculo em `df_usuarios_empresas`;
- falhas internas de convite ou reset;
- detalhes de autorização por empresa.

Detalhes técnicos podem ser registrados apenas nos logs do servidor da Edge Function.

## Frontend e service

O fluxo frontend deve enviar `empresaId` ativo ao service de usuários.

O service `enviarAcessoUsuarioEmpresa` deve chamar a Edge Function `convidar-usuario` com `empresaId` e não deve chamar `supabase.auth.resetPasswordForEmail` diretamente para este fluxo.

O fallback de reset, quando necessário, deve ficar dentro da Edge Function e somente depois das validações de sessão, autorização por empresa e vínculo do e-mail alvo.

## Arquivos do ciclo

- `supabase/functions/convidar-usuario/index.ts`
- `src/services/usuariosService.js`
- `src/App.jsx`

## Checklist de regressão

- Master envia link para usuário da empresa ativa.
- Admin da empresa envia link para usuário da própria empresa.
- Admin da empresa A não envia link para usuário da empresa B.
- Chamada sem `empresaId` não envia link.
- Usuário sem permissão não envia link.
- E-mail inexistente ou fora da empresa não revela existência.
- Mensagem visual continua amigável e genérica.

## Observação operacional

Esta correção é de Edge Function e service/frontend. Ela não altera RLS, policies, CSS/layout, Pipedream, importador CSV ou centro de custo.
