# MOBILE FINAL — Ajustes aplicados

Base usada: diretório enviado como `dona-flor-financeiro-main(17).zip`.

## Alterações reais realizadas

### 1. Scroll do menu mobile
- O fundo da página agora é travado quando o menu mobile abre.
- `body` e `html` recebem classe temporária `mobile-nav-open`.
- O menu ganhou isolamento de scroll com `overscroll-behavior`, `-webkit-overflow-scrolling` e limite por `100dvh`.
- O backdrop bloqueia arrasto do fundo e o painel mantém rolagem própria.

### 2. Dashboard mobile — bloco Contas em aberto
- Valor, status e botão `Pago` agora usam coluna de ações mais estável.
- Botão `Pago` ganhou classe específica `dashboard-paid-button`.
- Status e botão foram alinhados com largura mínima consistente.

### 3. Filtros mobile
- Botões `Filtros`, `Limpar`, `PDF` e `CSV` foram padronizados em altura, padding, radius e alinhamento.
- Grupo de exportação usa grid com três colunas iguais no mobile.

### 4. Lixeira
- Mensagem de segurança atualizada para: restaurar em até 60 dias e remoção automática após 60 dias.
- Texto da quarentena ficou mais suave.
- Botão de exclusão definitiva ficou menos agressivo no mobile.

## Validação
- `npm install` executado.
- `npm run build` executado com sucesso.
- Único aviso: chunk acima de 500 kB, sem impedir build.

## Não alterado
- Desktop aprovado.
- PDF.
- Recorrência.
- Lógica financeira.
- Supabase.
- Arquitetura geral.
