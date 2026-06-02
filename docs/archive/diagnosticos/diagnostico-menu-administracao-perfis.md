# Diagnóstico do Menu Administração por Perfil — DNA Gestão

## 1. Objetivo

Registrar o diagnóstico técnico e de UX do menu Administração por perfil, com foco no perfil Gerente.

Este documento não implementa alteração de código. O objetivo é consolidar o entendimento atual antes de qualquer microciclo corretivo.

Diretriz: consolidar antes de alterar permissões visuais.

## 2. Contexto

O DNA Gestão é uma plataforma modular com áreas de Área de trabalho, Gestão Financeira, Gestão de Pessoas, Administração e Conta.

O Painel principal já foi reposicionado como Área de trabalho da empresa. O próximo ponto de atenção é o menu Administração, porque itens sensíveis aparecem para o perfil Gerente mesmo quando o próprio fluxo interno bloqueia ações administrativas.

O risco principal é de UX e governança: o usuário vê uma área administrativa, mas pode não ter permissão real para executar as ações internas.

Nota de estado atual validado em 2026-06-02:

- Gerente continua vendo Configurações.
- Gerente não acessa Lixeira.
- Gerente não acessa Importar contas.
- Gerente não acessa Filiais/Unidades.
- Admin/Master preservados.
- Operador sem acesso novo.

As matrizes e achados abaixo permanecem como diagnóstico histórico anterior aos ciclos corretivos.

## 3. Arquivos consultados

Arquivos localizados e consultados:

- `src/config/menuSections.js`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/MobileMenu.jsx`
- `src/hooks/useAppNavigation.js`
- `src/App.jsx`
- `src/pages/UsuariosPage.jsx`
- `src/pages/MasterPanelPage.jsx`
- `src/pages/BillingPage.jsx`
- `src/pages/OnboardingPage.jsx`
- `docs/security/permissoes-frontend.md`

Arquivos esperados que não foram localizados:

- `src/pages/ConfiguracoesPage.jsx`
- `src/pages/LixeiraPage.jsx`

Observação: os fluxos de Configurações e Lixeira aparecem renderizados diretamente em `src/App.jsx`.

## 4. Estrutura atual do menu

O arquivo `src/config/menuSections.js` define os seguintes grupos visuais:

| Grupo | Itens principais |
| --- | --- |
| Dashboard | Painel, Agenda, Notas |
| Financeiro | Contas, Análise Financeira, Importar contas |
| Gestão de Pessoas | Funcionários, Relatórios de Pessoas, Férias, Relatórios de Férias, Fechamento de Folha |
| Administração | Usuários, Empresas, Configurações, Plano comercial, Configuração inicial, Lixeira |
| Conta | Meu perfil, Sair |

O grupo Gestão de Pessoas usa `peopleOnly: true` nos seus itens.

O item Empresas usa `masterOnly: true`.

Os demais itens de Administração dependem principalmente dos filtros aplicados em `src/App.jsx`.

## 5. Como o menu é filtrado hoje

O `Sidebar.jsx` e o `MobileMenu.jsx` não aplicam regras próprias de permissão. Eles apenas renderizam as seções já filtradas recebidas por props.

A filtragem principal ocorre em `src/App.jsx`, na construção de `menuSectionsFiltradas`.

Regras relevantes identificadas:

- `importar` aparece quando `podeImportarContas()` retorna verdadeiro.
- `lixeira` aparece quando `podeGerenciarLixeira()` retorna verdadeiro.
- itens com `peopleOnly` aparecem quando `podeAcessarGestaoPessoas()` retorna verdadeiro.
- `usuarios`, `configuracoes`, `billing`, `filiais` e `onboarding` aparecem quando `podeAcessarConfiguracoes()` retorna verdadeiro.
- itens `masterOnly` aparecem quando `permissoesUsuario?.canManageCompanies` está ativo.

Funções relevantes:

- `podeAcessarConfiguracoes()` aceita `admin` e `gerente`, além de `canAccessSettings`.
- `podeAdministrarUsuarios()` aceita `canManageUsers` ou `admin`.
- `podeGerenciarLixeira()` aceita `admin` e `gerente`.
- `podeExcluirDefinitivoFinanceiro()` aceita apenas `admin`.
- `podeAcessarGestaoPessoas()` aceita `admin`.

## 6. Itens atuais de Administração

| Item | Tela | Regra visual atual | Observação |
| --- | --- | --- | --- |
| Usuários | `usuarios` | `podeAcessarConfiguracoes()` | Gerente pode ver a tela, mas ações administrativas dependem de `podeAdministrarUsuarios()`. |
| Empresas | `master-empresas` | `masterOnly` e `canManageCompanies` | Restrito a quem pode gerenciar empresas. |
| Configurações | `configuracoes` | `podeAcessarConfiguracoes()` | Gerente pode ver por regra atual. |
| Plano comercial | `billing` | `podeAcessarConfiguracoes()` | Gerente pode ver por regra atual, mas a documentação indica que Gerente não deve editar plano comercial. |
| Configuração inicial | `onboarding` | `podeAcessarConfiguracoes()` | Gerente pode ver por regra atual. |
| Lixeira | `lixeira` | `podeGerenciarLixeira()` | No diagnóstico histórico, Gerente podia ver/restaurar; no estado atual validado, Gerente não acessa Lixeira. |

## 7. Comportamento atual por perfil

### Operador

Pelo código e pela documentação de permissões, o Operador não deve ver áreas administrativas, não deve ver Lixeira e não deve acessar Importar contas.

Se algum Operador tiver flags especiais como `canAccessSettings`, o comportamento pode mudar. Isso exige validação da matriz de permissões antes de qualquer correção.

### Gerente

No diagnóstico histórico, o Gerente via:

- `Usuários`, porque `podeAcessarConfiguracoes()` inclui `gerente`;
- `Configurações`, pelo mesmo motivo;
- `Plano comercial`, pelo mesmo motivo;
- `Configuração inicial`, pelo mesmo motivo;
- `Lixeira`, porque `podeGerenciarLixeira()` inclui `gerente`;
- `Importar contas`, porque `podeImportarContas()` reaproveita `podeAcessarConfiguracoes()`.

O Gerente não vê `Empresas`, salvo se possuir `canManageCompanies`.

Na tela Usuários, o Gerente pode acessar a página, mas as ações de convite, reset, alteração de perfil, alteração de filiais e remoção dependem de `podeAdministrarUsuarios()`, que não inclui `gerente` por padrão.

No diagnóstico histórico, o Gerente podia restaurar itens na Lixeira. No estado atual validado, Gerente não acessa Lixeira; exclusão definitiva segue fora do escopo de Gerente.

### Admin

O Admin vê os itens administrativos gerais:

- Usuários;
- Configurações;
- Plano comercial;
- Configuração inicial;
- Lixeira.

Também pode operar ações administrativas sensíveis, como administração de usuários e exclusão definitiva na Lixeira, respeitando as proteções existentes.

O Admin comum não deve ver Empresas/Master se não possuir `canManageCompanies`.

### Master

O Master tem acesso ampliado, incluindo Empresas/Master quando `canManageCompanies` está ativo.

## 8. Análise específica do grupo Administração

O agrupamento visual Administração reúne itens com riscos e naturezas diferentes:

- gestão de usuários;
- configuração do sistema;
- plano comercial;
- implantação inicial;
- lixeira;
- empresas/master.

O problema não está no `Sidebar.jsx` ou no `MobileMenu.jsx`. O comportamento vem da regra central em `App.jsx`, especialmente do uso de `podeAcessarConfiguracoes()` para liberar vários itens diferentes.

Esse desenho simplifica o filtro, mas cria uma permissão visual ampla demais para o perfil Gerente.

## 9. Riscos encontrados

| Risco | Severidade | Descrição |
| --- | --- | --- |
| Gerente ver Usuários | Alta | A tela envolve dados de usuários, perfis, filiais e ações administrativas, mesmo que ações internas estejam bloqueadas. |
| Gerente ver Plano comercial | Média/alta | Plano comercial é uma área sensível de contratação, limites ou faturamento. A documentação indica que Gerente não deve editar Billing. |
| Gerente ver Configuração inicial | Média/alta | Onboarding pode alterar configuração estrutural da empresa. |
| Gerente ver Configurações | Média | Pode ser aceitável para configurações operacionais, mas precisa separação entre configuração sensível e não sensível. |
| Gerente ver Lixeira | Média | Achado histórico superado: no estado atual validado, Gerente não acessa Lixeira. |
| Menu desktop/mobile dependerem do mesmo filtro | Baixa | É positivo para consistência, mas qualquer regra ampla afeta os dois menus ao mesmo tempo. |

## 10. Matriz visual recomendada

Matriz recomendada para o grupo Administração:

| Item | Operador | Gerente | Admin | Master | Recomendação |
| --- | --- | --- | --- | --- | --- |
| Usuários | Não | Não | Sim | Sim | Remover do menu do Gerente, salvo decisão explícita em contrário. |
| Empresas | Não | Não | Não | Sim | Manter restrito a Master/canManageCompanies. |
| Configurações | Não | A decidir | Sim | Sim | Separar configuração operacional de configuração sensível antes de mudar. |
| Plano comercial | Não | Não | Sim | Sim | Remover do menu do Gerente. |
| Configuração inicial | Não | Não | Sim | Sim | Remover do menu do Gerente. |
| Lixeira | Não | Não | Sim | Sim | Estado atual validado: Lixeira restrita a Admin/Master. |

Matriz recomendada para ações sensíveis:

| Ação | Operador | Gerente | Admin | Master |
| --- | --- | --- | --- | --- |
| Administrar usuários | Não | Não | Sim | Sim |
| Alterar perfis | Não | Não | Sim | Sim |
| Alterar filiais de usuários | Não | Não | Sim | Sim |
| Editar plano comercial | Não | Não | Sim | Sim |
| Executar configuração inicial | Não | Não | Sim | Sim |
| Restaurar da Lixeira | Não | Não | Sim | Sim |
| Excluir definitivamente da Lixeira | Não | Não | Sim | Sim |

## 11. O que não alterar sem decisão

Não alterar sem uma decisão de produto/permissões:

- acesso do Gerente à Lixeira, porque o estado atual validado não permite acesso;
- acesso do Gerente a Configurações, porque pode existir uso operacional ainda não separado;
- flags como `canAccessSettings`, `canManageUsers` e `canManageCompanies`;
- regras de RLS, policies, Edge Functions ou banco;
- contrato das páginas administrativas;
- navegação mobile e desktop separadamente.

Também não é recomendado corrigir apenas o texto do menu. O problema identificado é de matriz visual de permissões.

## 12. Próximo ciclo recomendado

Próximo ciclo mais seguro: documentar e aprovar a matriz final de menu por perfil antes de alterar código.

Justificativa:

- `podeAcessarConfiguracoes()` hoje libera mais de um item sensível ao mesmo tempo;
- alguns itens têm decisão clara, como Usuários e Plano comercial;
- outros itens ainda exigem decisão, como Configurações e Lixeira;
- alterar tudo de uma vez pode quebrar fluxos operacionais já usados por Gerente.

Depois da matriz aprovada, o microciclo técnico recomendado é separar o filtro visual de Administração por item:

- `usuarios` deve depender de `podeAdministrarUsuarios()` ou regra equivalente aprovada;
- `billing` deve depender de permissão de Admin/Master;
- `onboarding` deve depender de permissão de Admin/Master;
- `configuracoes` deve receber decisão específica;
- `lixeira` deve manter regra própria restrita a Admin/Master.

## 13. Critérios de aceite para correção futura

Uma correção futura deve atender a estes critérios:

- Gerente não vê Usuários se não puder administrar usuários.
- Gerente não vê Plano comercial se não puder editar plano comercial.
- Gerente não vê Configuração inicial se esse fluxo for restrito a Admin/Master.
- Gerente não vê Lixeira nem acessa a rota/view diretamente.
- Operador não vê Administração.
- Admin vê Administração geral.
- Master vê Empresas/Master.
- Desktop e mobile exibem a mesma matriz.
- Rotas diretas continuam protegidas por guard interno.
- Nenhuma regra de banco, RLS ou policy é alterada sem ciclo próprio.

## 14. Checklist de validação futura

- Validar menu desktop com Operador.
- Validar menu mobile com Operador.
- Validar menu desktop com Gerente.
- Validar menu mobile com Gerente.
- Validar menu desktop com Admin.
- Validar menu mobile com Admin.
- Validar menu desktop com Master.
- Validar menu mobile com Master.
- Confirmar que Usuários não aparece para Gerente, se essa decisão for aprovada.
- Confirmar que Plano comercial não aparece para Gerente, se essa decisão for aprovada.
- Confirmar que Configuração inicial não aparece para Gerente, se essa decisão for aprovada.
- Confirmar que Lixeira não aparece para Gerente e que a rota/view direta permanece bloqueada.
- Confirmar que rotas diretas exibem acesso restrito quando necessário.
- Rodar build quando houver alteração em `src/`.
