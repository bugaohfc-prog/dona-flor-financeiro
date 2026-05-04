# DF Gestão Financeira — Layout, Menu e Notas

Versão gerada a partir do marco zero funcional com foco em UX desktop, organização de menu e módulo de notas.

## Alterações principais

- Menu desktop reorganizado em módulos: Principal, Financeiro, Notas, Análise e Sistema.
- Sidebar desktop suavizada com fundo claro, mantendo verde apenas como destaque de item ativo.
- Removida redundância visual do nome grande do sistema na sidebar.
- Usuário movido para o topo, com ações rápidas de Notas, Configurações e Sair.
- Mobile preservado com menu próprio e estrutura equivalente.
- Criada tela dedicada `notas` para centralizar busca, listagem e gestão de notas.
- Dashboard mantém apenas bloco compacto de notas recentes com botão “Ver todas as notas”.

## Validação

- Build executado com sucesso via `npm run build`.
- Sem alteração de banco de dados nesta etapa.
- Sem alteração no fluxo principal de contas, Auth, usuários ou RLS.
