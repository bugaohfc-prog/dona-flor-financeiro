# Estabilidade do app - tela branca/F5

Data: 2026-06-01

## Hipoteses tratadas

- Erro de renderizacao sem Error Boundary global podia deixar o React em tela branca.
- Falha de carregamento de chunk lazy do Vite apos deploy/F5 podia impedir a tela de renderizar.
- Sessao expirada podia deixar o usuario preso no fluxo de retomada apos login, exigindo clique manual em `Continuar`.

## Correcoes aplicadas

- Adicionado Error Boundary global no bootstrap React.
- Adicionado Error Boundary ao Suspense de rotas lazy.
- Adicionada tela amigavel de recuperacao com `Tentar novamente` e `Recarregar pagina`.
- Falhas de chunk lazy registram erro no console e tentam no maximo um reload automatico por sessao via `sessionStorage`.
- A tentativa de reload de chunk e limpa quando o app volta a autenticar/renderizar com sucesso.
- Ao encerrar sessao, o app guarda a ultima tela interna valida.
- Apos login bem-sucedido, o app volta automaticamente para a tela guardada ou para `dashboard`.

## Escopo preservado

- Banco, RLS e migrations nao foram alterados.
- E-mail, GitHub Actions, secrets e envio real nao foram alterados.
- Regras de permissao nao foram alteradas.
- Regras financeiras nao foram alteradas.
- Gestao de Pessoas funcional nao foi alterada.

## Validacao manual esperada

- Abrir o app sem tela branca.
- Navegar por Painel, Contas, Notas, Analise Financeira e Configuracoes.
- Usar F5 em telas internas.
- Usar voltar/avancar do navegador.
- Trocar empresa, se aplicavel.
- Validar Admin, Master e Gerente.
- Simular sessao expirada, fazer login novamente e confirmar retorno automatico para a tela anterior valida ou `dashboard`.
- Confirmar que, se ocorrer erro de renderizacao, aparece tela de recuperacao em vez de tela vazia.
