# FASE 10.6 — Dashboard Operacional

## Objetivo
Transformar o dashboard em uma visão operacional por filial, preservando o dashboard financeiro já validado.

## Implementado

- Cards operacionais por filial:
  - unidade com maior volume financeiro;
  - unidade com maior pendência;
  - unidade com maior risco vencido.
- Ranking de unidades com:
  - total financeiro;
  - número de contas;
  - valor pendente;
  - barra proporcional de volume.
- Base operacional sem travar no filtro de filial selecionada, permitindo comparar unidades.
- Filtros já existentes continuam respeitados para status, centro de custo, mês, período e busca.
- O filtro de filial segue controlando KPIs principais, gráficos e contas abertas.

## Preservado

- RLS existente.
- Multiempresa.
- Filiais de Contas e Notas.
- Recorrência hardened.
- Dashboard validado da 10.5D.
- Sincronização mobile/desktop.

## Validação recomendada

1. Criar contas em pelo menos duas filiais.
2. Abrir o Dashboard.
3. Conferir os três cards operacionais.
4. Conferir o ranking de unidades.
5. Trocar o filtro de filial e validar que os KPIs principais mudam.
6. Confirmar que o ranking ainda compara as unidades dentro dos filtros gerais.
7. Validar no mobile.
