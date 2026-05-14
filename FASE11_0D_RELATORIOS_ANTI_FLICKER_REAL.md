# FASE 11.0D — Relatórios Anti-Flicker Real

## Objetivo
Eliminar o pisca-pisca ao sair e voltar para a página de Relatórios.

## Causa encontrada
O flicker não vinha somente da busca de dados. Havia CSS global herdado da fase de transições suaves aplicando animações em `.relatorios-page > section` com delays diferentes. Como Relatórios tem muitos widgets, cada seção reaparecia em cascata ao montar a rota.

## Correção aplicada
- Override específico em `src/pages/Relatorios.jsx` para desligar animações globais dentro de `.relatorios-page`.
- Mantido apenas transições seguras de cor/borda/sombra.
- Filtro sticky recebeu classe própria `relatorio-sticky-filtros`.
- Filtro sticky estabilizado com `transform: translateZ(0)`, `backface-visibility` e `contain: paint`.

## O que validar
1. Entrar em Relatórios.
2. Sair para Dashboard/Contas.
3. Voltar para Relatórios 5 vezes.
4. Confirmar que não há piscada em cascata dos cards.
5. Confirmar que o filtro continua sticky.

## Observação
A fase preserva a UX da 11.0A e corrige o comportamento visual para liberar a evolução 11.1.
