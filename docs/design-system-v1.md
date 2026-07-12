# DNA Gestão — Guia Visual V1

## Escopo

Este documento registra o padrão visual consolidado da V1. A referência macro é o Painel; a referência de componentes é Notas. V2 permanece fora deste guia.

## Design Tokens

### Cores

| Token | Valor | Uso |
|---|---|---|
| `--df-color-brand` | `#0f766e` | ações primárias, seleção e identidade |
| `--df-color-brand-soft` | `#f0fdfa` | superfícies suaves da marca |
| `--df-color-page` | `#f8fafc` | fundo de página |
| `--df-color-surface` | `#ffffff` | cards, controles e modais |
| `--df-color-text` | `#0f172a` | texto principal |
| `--df-color-muted` | `#64748b` | texto auxiliar |
| `--df-color-border` | `#e2e8f0` | bordas neutras |
| `--df-color-success` | `#15803d` | sucesso e concluído |
| `--df-color-warning` | `#92400e` | atenção e pendência |
| `--df-color-danger` | `#b91c1c` | erro, perigo e vencido |

### Tipografia

- Família: `system-ui`, com fallback para Segoe UI e Arial.
- Texto: 400.
- Labels: 600–700.
- Kicker e status: 800–900.
- Evitar 950 para novas implementações.
- Títulos devem preservar hierarquia entre kicker, título, descrição e conteúdo.

### Escalas

| Categoria | Escala oficial |
|---|---|
| Tipografia KPI | 20px compacto, 24px principal |
| Controle | 40px padrão; 44–48px touch |
| Radius controle | 12px |
| Radius card | 16px |
| Radius seção/hero | 22px |
| Radius pill | 999px |
| Sombra suave | `0 8px 20px rgba(15,23,42,.04)` |
| Sombra card | `0 10px 28px rgba(15,23,42,.06)` |
| Espaçamento base | múltiplos de 4px, priorizando 8, 12, 16, 20 e 24px |

## Componentes oficiais

### PageHero

Usar para cabeçalhos de página com kicker opcional, título, descrição e ações. Variantes devem preservar a semântica de `header` e manter ações acessíveis por teclado.

### KPI

Usar valor principal em 24px, label legível, descrição auxiliar e estado semântico. KPIs compactos podem usar 20px.

### Cards

Cards devem usar superfície branca, borda neutra, radius de 16px e sombra card. Cards internos podem usar radius de 12px quando houver hierarquia clara.

### Controles

Botões, inputs, selects e textareas usam radius de 12px e altura mínima de 40px. Controles touch devem respeitar 44px quando possível.

### Badges e status

Badges são pills. A cor nunca deve ser a única indicação: combinar texto, ícone ou contexto.

### Modais

Modais usam superfície branca, radius de seção, sombra elevada, cabeçalho claro, fechamento acessível e scroll interno quando necessário.

## Estados

- `focus-visible`: foco sempre visível e contrastante.
- `disabled`: opacidade reduzida, cursor de não permitido e sem depender apenas de cor.
- vazio: explicar o estado e orientar a próxima ação.
- loading: preservar contexto e evitar mudança brusca de layout.
- erro: informar causa de forma segura e ação possível.
- sucesso: confirmação curta e sem bloquear a navegação.

## Responsividade

Validar no mínimo 360×800, 390×844, 768×1024, 1024×768, 1366×768 e 1440×900. Não permitir scroll horizontal acidental, sobreposição de FAB, controles espremidos ou modais maiores que a viewport.

## Acessibilidade

- Todo botão somente com ícone precisa de nome acessível.
- Estados selecionados devem expor `aria-selected` quando aplicável.
- Expansões devem expor `aria-expanded`.
- Contraste deve ser validado para texto normal, texto pequeno e badges.
- Foco de teclado não deve ser removido sem substituto visível.

## Regras de manutenção

- Preferir tokens globais a valores literais novos.
- Não adicionar `!important` sem justificativa documentada.
- Não duplicar primitives por domínio.
- Não remover seletores sem comprovar que estão mortos em runtime e em estados dinâmicos.
- Alterações visuais devem ser feitas em lotes pequenos, com build, diff check e validação desktop/mobile.

## Componentes de referência

- Painel: composição macro e hierarquia de primeira dobra.
- Notas: PageHero, filtros, tabs, cards, badges e densidade visual.
- Folha/Fechamento: referência de prioridade para validações funcionais e responsivas.