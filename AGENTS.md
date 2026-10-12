# AGENTS.md — DNA Gestão / Dona Flor Financeiro

Estas regras são obrigatórias para qualquer trabalho neste repositório.

O DNA Gestão é um sistema operacional de gestão.

Princípio central:

> O problema mais difícil não é cadastrar os dados; é fazer o sistema conduzir a operação.

Uma funcionalidade não está pronta apenas porque persiste, recarrega e passa nos testes. Ela também deve ajudar o usuário a entender o que aconteceu, o que precisa fazer, o que acontece depois e o que não pode ser esquecido.

---

## 1. Missão e prioridades

Priorizar, nesta ordem:

1. segurança;
2. integridade operacional;
3. fonte de verdade;
4. regras de negócio;
5. clareza para o usuário;
6. causa comprovada;
7. alteração mínima;
8. validação proporcional ao risco;
9. economia de tempo e créditos.

Nunca sacrificar integridade operacional para concluir um lote mais rápido.

Ausência de evidência nunca significa PASS. O que não puder ser comprovado deve ser classificado como NOT PROVEN.

---

## 2. Problema antes da solução

Antes de alterar:

1. identificar o problema real;
2. separar problema da solução sugerida;
3. verificar o comportamento atual;
4. localizar a causa;
5. avaliar efeitos colaterais e integrações;
6. somente então definir a mudança.

Não implementar automaticamente uma sugestão. Se houver alternativa mais simples, segura ou coerente, explicar e propor. Aguardar decisão quando isso mudar o escopo funcional.

Em análise de produto, usar quando útil:

- MANTER;
- AJUSTAR;
- REJEITAR;
- ADIAR;
- NOT PROVEN.

---

## 3. Escopo e minimalidade

- Trabalhar somente no escopo autorizado.
- Fazer a menor alteração capaz de resolver a causa.
- Não ampliar lotes nem misturar problemas independentes.
- Não criar abstração, tela, serviço, tabela ou infraestrutura sem uso real.
- Reutilizar estruturas adequadas e preservar contratos aprovados.
- Não reconstruir módulo funcional sem necessidade comprovada.

Se a solução exigir mudança fora do escopo: parar, demonstrar a necessidade, explicar impacto e aguardar autorização.

Achados laterais devem ser registrados e separados, não corrigidos por conveniência.

---

## 4. Fonte de verdade e integridade

Cada conceito de negócio deve possuir uma fonte canônica.

Não criar segunda fonte de verdade para facilitar Dashboard, Agenda, Central Operacional, alertas, relatórios ou integrações.

Camadas derivadas podem referenciar a origem, acompanhar responsabilidade, registrar prazo e próxima ação e guardar histórico. Não devem duplicar valores ou estados pertencentes à fonte.

Dados derivados devem ser recalculáveis ou possuir vínculo e versionamento claros.

Antes de alterar um conceito, identificar:

- fonte canônica;
- consumidores e contratos;
- efeitos sobre histórico;
- efeitos sobre segurança e auditoria.

Uma mudança na origem deve produzir consequência previsível nos consumidores.

---

## 5. Condução operacional

Quando o sistema já sabe que existe obrigação, risco, prazo, dependência ou próxima ação, não exigir cadastro manual redundante para lembrar o usuário.

Preferir:

evento registrado
→ obrigação identificada
→ acompanhamento
→ ação do usuário quando necessária.

Para processo operacional relevante, definir quando aplicável:

- início e criação automática;
- responsável, prazo e terceiro aguardado;
- consequência da inação e forma de reaparecimento;
- bloqueio e evidência de resolução;
- integração, mudança posterior e próxima ação.

Se essas respostas forem necessárias e estiverem indefinidas, o processo não está operacionalmente pronto.

---

## 6. Git

Trabalhar somente na branch explicitamente definida. Nunca fazer push direto na main.

Promoções devem usar Pull Request, checks e merge normal.

Nunca usar sem autorização explícita:

- `git clean`;
- reset destrutivo ou `reset --hard`;
- amend;
- rebase;
- force push;
- cherry-pick;
- `git add .`;
- `git add -A`.

Sempre:

- preservar stash e arquivos não rastreados;
- adicionar somente arquivos do lote;
- registrar SHA nos checkpoints;
- manter histórico claro por lote correlato.

Não incluir arquivos alheios ao escopo em commit.

---

## 7. /DEBUG antes de corrigir

Usar /DEBUG diante de erro, inconsistência, regressão, comportamento inesperado ou divergência entre ambientes.

Fluxo:

1. reproduzir com segurança;
2. reunir evidência;
3. identificar a causa;
4. localizar somente arquivos e objetos envolvidos;
5. separar causa de sintoma;
6. determinar impacto;
7. somente depois corrigir.

Não alterar baseado em hipótese. Se a causa não estiver comprovada, continuar em /DEBUG e declarar o que permanece NOT PROVEN.

Não provocar mutação perigosa apenas para reproduzir falha. Evitar varredura ampla quando o escopo já for conhecido.

---

## 8. Implementação e refactor

Depois de comprovada a necessidade:

- fazer mudança pequena e correlata;
- corrigir a causa, não apenas o sintoma;
- preservar contratos válidos;
- reutilizar estruturas existentes;
- evitar abstrações prematuras;
- não misturar refactor estético com alteração funcional.

Antes de editar, identificar arquivos, contratos, fonte de verdade, risco e critérios de aceite.

Não transformar correção pequena em reestruturação ampla. Mudança estrutural fora do escopo exige nova autorização.

---

## 9. Checkpoint e rollback

Antes de migration, mutação relevante, mudança de permissão/configuração, merge, deploy ou promoção, registrar:

- branch e SHA;
- git status;
- ambiente;
- estado funcional conhecido.

Quando aplicável, definir rollback reversível antes da operação.

Se houver quebra:

1. parar novas alterações;
2. identificar impacto e mutações ocorridas;
3. restaurar estado estável por método não destrutivo;
4. comprovar a restauração;
5. registrar a causa;
6. somente então continuar.

Nunca empilhar correções sobre estado quebrado.

---

## 10. Segurança e ambientes

Produção só pode ser alterada com autorização explícita para o lote atual.

Antes de qualquer escrita, confirmar ambiente, project ref ou destino equivalente, intenção autorizada e escopo.

Não alterar sem autorização:

- Supabase, dados ou permissões;
- migrations e Edge Functions;
- variáveis e configuração;
- deploy de produção.

Mudança funcional ou de banco deve ser validada primeiro em staging, salvo autorização excepcional explícita.

Nunca solicitar, registrar ou exibir segredos; incluir segredo em log; usar mock como prova final conectada; ou confundir autenticação com autorização de escrita.

---

## 11. Banco, RLS e autoridade

Antes de criar ou alterar tabela, coluna, índice, constraint, RPC, trigger, policy, grant ou migration, verificar se a estrutura existente já resolve o problema.

Preservar:

- tenant;
- RLS e FORCE RLS quando aplicável;
- histórico e auditoria;
- integridade referencial;
- menor privilégio.

Não:

- afrouxar RLS para facilitar teste;
- remover proteção sem causa;
- fazer DELETE físico quando o domínio usa arquivamento lógico;
- usar SQL manual como atalho para fluxo oficial;
- duplicar estado de negócio;
- criar migration não autorizada.

Migration necessária mas não autorizada: PARAR e pedir autorização.

Regra crítica não pode depender apenas do frontend. O backend deve impedir mutação sem permissão, estado inválido, duplicidade proibida, conclusão incompatível e resolução sem evidência obrigatória.

---

## 12. Idempotência e automação

Operações repetíveis e automações devem ser idempotentes quando aplicável.

A mesma origem e regra não podem gerar equivalentes por reload, retry, job repetido, clique repetido, concorrência ou reconexão.

Quando houver unicidade lógica:

- identificar a chave funcional;
- proteger no nível adequado;
- testar repetição;
- preservar auditoria.

Não depender somente de o frontend chamar uma vez.

Automação deve ser previsível, auditável, baseada em fonte confiável e reversível quando aplicável. Não pode concluir processo crítico silenciosamente, ocultar erro ou transformar hipótese em fato.

Alertas são canais, não fontes de verdade. Falha do canal não pode apagar a obrigação.

---

## 13. Responsabilidade, estados e próxima ação

Processo acompanhado deve saber, quando aplicável:

- responsável interno;
- ação necessária;
- prazo;
- terceiro aguardado;
- próxima ação e revisão.

“Aguardando terceiro” não significa “sem responsável”. Não inventar responsável sem autoridade; ausência de modelo suficiente é gap.

Status deve ter consequência real. Para cada estado, definir o que muda, o que é permitido ou bloqueado, quem age e qual é a próxima ação.

Não misturar:

- estado de negócio;
- prioridade ou severidade;
- urgência;
- adiamento;
- vencimento.

Adiar atenção não altera estado real nem prazo original.

---

## 14. UX, linguagem e usuário novo

A interface deve falar a linguagem da operação. O usuário não deve precisar conhecer tabela, RPC, constraint, arquitetura ou estado interno.

Tela ou cartão importante deve explicar:

1. o que aconteceu;
2. por que importa;
3. o que fazer;
4. onde agir;
5. o que acontece depois.

A ação principal deve ser evidente e levar diretamente à resolução quando possível.

Para nova feature, processo ou mudança relevante de UX, verificar se pessoa alheia ao desenvolvimento entende a situação, identifica criticidade, localiza a ação, executa a tarefa e compreende o resultado.

Não exigir esse teste para correção técnica sem impacto de UX.

---

## 15. Teste das 72 horas

Para processo crítico, avaliar se após 72 horas sem acesso o responsável consegue identificar:

- o que aconteceu e mudou;
- o que venceu ou se tornou crítico;
- o que aguarda terceiro;
- o que foi bloqueado;
- qual é a próxima ação.

Risco não pode ficar invisível porque um módulo não foi aberto.

Esse é critério de produto, não obrigação de alerta externo em toda feature.

Quando falhar, identificar se falta persistência, responsabilidade, prazo, integração, reaparecimento ou ação direta.

---

## 16. Evidência, conclusão e reabertura

“Concluído” e “Resolvido” devem ter significado proporcional ao risco.

Evidência pode ser decisão, data, usuário, vínculo estável, documento, referência externa, retorno de integração ou outro dado estruturado.

Nem toda ação exige upload. Não burocratizar processo simples; quanto maior o risco da conclusão incorreta, melhor deve ser a evidência.

Não resolver acompanhamento sem resolver ou classificar sua fonte.

Quando informação relevante mudar após conferência ou conclusão intermediária, avaliar se deve:

- marcar o processo como desatualizado;
- gerar nova obrigação;
- reabrir etapa;
- exigir nova conferência.

Não reabrir por mudança irrelevante. Preservar decisões e evidências anteriores.

---

## 17. Histórico e cutover

Ao introduzir regra, automação ou camada operacional, não assumir que todo histórico deve ser convertido automaticamente.

Antes de backfill:

1. identificar e avaliar os dados históricos;
2. medir risco de falsos positivos;
3. definir estratégia de cutover;
4. separar histórico de eventos novos;
5. prever revisão humana quando necessária.

Não criar centenas de pendências apenas porque é tecnicamente possível.

Camada operacional deve referenciar a origem, sem duplicar valores. Estado de acompanhamento não substitui o estado real.

Histórico concluído deve permanecer legível após mudanças de catálogo, configuração ou relacionamento.

---

## 18. Arquitetura de interface

Mobile, tablet e desktop devem preservar regras, dados relevantes, permissões e resultados funcionais.

Layout e DOM podem variar quando isso melhora a experiência sem alterar comportamento.

Preferir componentes compartilhados quando fizer sentido. Não duplicar regra de negócio por breakpoint nem acoplar componente compartilhado a detalhes internos de página.

CSS:

- usar classes próprias em componentes compartilhados;
- manter estilos de domínio escopados;
- evitar `!important`;
- evitar posicionamento absoluto estrutural;
- evitar seletores globais frágeis;
- evitar inline style para layout estático quando CSS for adequado.

---

## 19. Organização dos lotes

Agrupar correções pela causa técnica e features pela capacidade operacional, fonte de verdade e validação compartilhada.

Não misturar demandas independentes nem fragmentar o mesmo problema artificialmente por tela ou botão.

Antes de iniciar, definir:

- objetivo único e escopo;
- dependências;
- arquivos e contratos;
- critérios de aceite;
- validação necessária.

Não transformar lote em “aproveitar e corrigir”. Achado fora do escopo deve seguir separado.

---

## 20. Validação e entrega

Validação deve ser proporcional ao risco e ao diff.

Durante o lote:

- testes focados;
- `git diff --check`.

No fechamento de alteração funcional relevante, quando aplicável:

- suíte completa;
- build;
- viewports afetados;
- E2E real.

Não repetir checkpoint aprovado sem novo diff capaz de afetá-lo. Sem novo diff, não repetir automaticamente suíte, build, staging, smoke ou viewports.

Antes de declarar pronto, comprovar quando aplicável:

1. dados e serviços reais;
2. loading, erro e estado vazio;
3. ação ponta a ponta;
4. persistência após reload;
5. tenant e segurança;
6. ausência de regressão;
7. viewports afetados;
8. atendimento ao pedido original.

Processo operacional relevante também exige próxima ação, responsável, prazo, consequência da inação, trava, evidência, integração e comportamento após mudança quando aplicável.

Item necessário não comprovado permanece NOT PROVEN.

---

## 21. Staging, produção e promoção

Validar mudança funcional em staging antes da promoção.

Fixture deve ser necessária, segura, identificável, isolada, encerrada logicamente e sem dado ativo desnecessário ao final. Registrar mutações relevantes do E2E.

Produção não é ambiente de experimentação. Smoke deve ser mínimo e preferencialmente read-only.

Não repetir em produção mutação já comprovada em staging apenas para obter outro PASS.

DML real de teste em produção exige necessidade comprovada, autorização explícita, escopo controlado e encerramento definido.

Sem novo diff após aprovação de staging, promover em três gates:

### Gate 1 — Git

- fazer fetch;
- verificar drift;
- analisar somente impacto relevante.

Sem impacto, não repetir staging.

### Gate 2 — PR

- conferir escopo;
- aguardar checks;
- usar merge normal.

Não usar squash, rebase ou push direto na main.

### Gate 3 — Produção

- confirmar SHA e ambiente;
- aplicar somente migrations autorizadas;
- confirmar deployment, READY, HTTP e backend;
- executar smoke mínimo.

Não ampliar escopo durante promoção.

---

## 22. Regressões e regras externas

Se surgir erro durante validação ou promoção:

1. parar;
2. entrar em /DEBUG;
3. identificar origem;
4. separar código, migration, deploy, contrato, autenticação, dados ou drift;
5. corrigir somente após causa comprovada.

Não repetir todo o ciclo automaticamente. Se a main avançar, analisar apenas o novo diff e seu impacto.

Em conflito, resolver pela intenção funcional. Nunca escolher `ours` ou `theirs` para arquivo inteiro sem análise.

Não inventar prazo ou obrigação legal, interpretação jurídica, requisito fiscal ou trabalhista.

Regra externa crítica exige fonte oficial ou decisão de negócio validada. Separar prazo legal de margem operacional interna.

Dúvida permanece NOT PROVEN e não deve virar constraint de banco.

---

## 23. Relatório final

Relatório deve ser curto, factual e decisório.

Informar somente quando aplicável:

- branch e SHA inicial/final;
- arquivos e alteração;
- causa ou necessidade;
- migrations;
- testes, build e E2E;
- ambiente e mutações;
- PASS, FAIL e NOT PROVEN;
- pendências reais;
- preservação de stash e untracked.

Não repetir toda a história do projeto nem declarar pronto o que foi implementado, mas não comprovado.

---

## 24. Regra final

O DNA Gestão não deve apenas registrar o que aconteceu. Deve ajudar a conduzir o que precisa acontecer.

Antes de entregar processo importante, perguntar:

> Uma pessoa comum consegue entender o que precisa fazer agora, e o sistema perceberá se isso não for feito?

Se a resposta for não, revisar o desenho antes de ampliar o código.

Diagnosticar uma vez.
Resolver a causa.
Preservar a fonte de verdade.
Automatizar somente o confiável.
Validar proporcionalmente.
Não esconder risco.
Não depender da memória humana quando o sistema já possui informação suficiente.
