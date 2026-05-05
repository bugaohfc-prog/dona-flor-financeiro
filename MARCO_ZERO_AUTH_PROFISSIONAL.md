# Marco Zero - Auth Profissional

Esta versão corrige e fortalece o fluxo de autenticação sem alterar o core financeiro.

## Entrou nesta versão

- Tratamento robusto de sessão inválida/expirada.
- Fallback para nunca ficar travado em `Carregando...`.
- Logout seguro com limpeza de estados locais.
- Timeout por inatividade ajustado:
  - aviso com 12 minutos sem atividade;
  - logout com 15 minutos sem atividade;
  - expiração total mantida em 8 horas.
- Tela de login com fluxo de recuperação/primeiro acesso.
- Tela para criar nova senha quando o Supabase retorna com evento `PASSWORD_RECOVERY`.
- Validação de senha forte no front:
  - mínimo 8 caracteres;
  - letra maiúscula;
  - letra minúscula;
  - número;
  - caractere especial.

## Observação importante

O envio de e-mail ainda depende da configuração do Supabase Auth/SMTP. O app está preparado para solicitar o envio e tratar o retorno, mas a entrega real depende do provedor de e-mail configurado no Supabase.
