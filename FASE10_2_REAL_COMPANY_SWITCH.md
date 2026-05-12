# FASE 10.2 — Real Company Switch

## Objetivo

Implementar troca real de empresa ativa sem ativar RLS ainda.

## Implementado

- Seletor real de empresa no Topbar para usuários com permissão de troca.
- Persistência da empresa ativa via `AppContext` já existente.
- Bloqueio de troca duplicada enquanto o refetch está em andamento.
- Limpeza segura dos dados tenant-scoped antes de carregar a nova empresa.
- Refetch automático de:
  - contas;
  - notas;
  - centros de custo;
  - lixeira;
  - configurações;
  - usuários da empresa.
- Retorno automático para o dashboard após a troca.
- Seletor da tela de usuários respeitando estado de carregamento.

## Arquivos alterados

- `src/App.jsx`
- `src/components/layout/Topbar.jsx`
- `src/styles/base.css`

## Intencionalmente não feito

- RLS não foi ativado.
- Não houve refactor destrutivo do App.jsx.
- Não houve alteração estrutural pesada no dashboard validado.
- Não houve uso de `window.location.reload()`.

## Validação técnica

Build executado com sucesso:

```bash
npm run build
```

Aviso mantido:

- bundle acima de 500 kB, já esperado pelo tamanho atual do App.jsx e dependências.

## O que validar no navegador

1. Login normal.
2. Dashboard carrega normalmente.
3. Usuário master com mais de uma empresa vê o seletor no topo.
4. Ao trocar empresa:
   - o seletor fica temporariamente bloqueado;
   - volta para o dashboard;
   - KPIs mudam conforme a empresa;
   - contas/notas/centros não misturam dados da empresa anterior;
   - aparece toast de sucesso.
5. Recarregar a página mantém a última empresa ativa quando ela ainda é válida para o usuário.
6. Usuário sem permissão master não deve ver o seletor no topo.

## Próxima fase recomendada

Após validação manual da troca real:

- FASE 10.3 — RLS gradual.
