# Dona Flor V26 Estruturada

## O que mudou

Esta versão inicia a separação estrutural do app em arquivos:

- `css/v26.css` — camada visual estável
- `js/v26/core.js` — utilitários e acesso seguro aos dados
- `js/v26/menu.js` — menu e submenus
- `js/v26/notas.js` — bloco de notas e prioridade
- `js/v26/relatorios.js` — filtros, CSV e PDF
- `js/v26/init.js` — inicialização

## Correções incluídas

- Menu e submenus estabilizados
- Recolher menu mais discreto
- Bloco de notas padronizado visualmente com Contas a pagar
- Prioridade como botão: Normal, Urgente e Crítico
- PDF blindado: sem nova aba, sem iframe, sem document.write e sem Blob HTML
- CSV mantido com integração real
- Mantém os scripts antigos, mas V26 carrega por último e assume controle dos pontos críticos

## SQL

Não precisa SQL para esta versão.

O arquivo `sql/V26-SEGURANCA-RLS-LEIA-ANTES.sql` é apenas orientação. Não execute sem revisar, porque o app atual usa login próprio e não Supabase Auth.

## Importante após subir

- Limpar cache do navegador ou abrir em aba anônima
- Se usar PWA instalado, remover e instalar novamente após o deploy
