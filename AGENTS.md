# AGENTS.md — DNA Gestão / Dona Flor Financeiro

Estas regras são obrigatórias para qualquer trabalho neste repositório.

O DNA Gestão é um sistema operacional de gestão.

Princípio central:

> O problema mais difícil não é cadastrar os dados; é fazer o sistema conduzir a operação.

Uma funcionalidade não está pronta apenas porque grava dados corretamente.
Ela precisa ajudar o usuário a entender o que aconteceu, o que precisa fazer, o que acontece depois e o que não pode ser esquecido.

---

## 1. Prioridades do projeto

Priorizar, nesta ordem:

1. segurança;
2. integridade operacional;
3. fonte de verdade;
4. regras de negócio;
5. clareza para o usuário;
6. causa técnica comprovada;
7. alteração mínima;
8. validação proporcional ao risco;
9. economia de tempo e créditos.

Nunca sacrificar integridade operacional apenas para concluir um lote mais rápido.

---

## 2. Problema antes da solução

Quando surgir uma solicitação, erro ou ideia:

1. identificar o problema real;
2. separar problema da solução sugerida;
3. verificar o comportamento atual;
4. localizar a causa;
5. avaliar efeitos colaterais;
6. verificar integração com os demais módulos;
7. somente então definir a alteração.

Não implementar automaticamente uma solução apenas porque foi sugerida.

Se existir alternativa mais simples, segura ou coerente:
- explicar;
- propor;
- aguardar decisão quando a mudança alterar o escopo funcional.

Em análises de produto, podem ser usadas classificações como:

- MANTER;
- AJUSTAR;
- REJEITAR;
- ADIAR;
- NOT PROVEN.

---

## 3. Escopo e minimalidade

- Trabalhar somente no escopo autorizado.
- Fazer a menor alteração capaz de resolver a causa real.
- Não ampliar um lote sem necessidade comprovada.
- Não misturar problemas independentes.
- Não criar abstração, tela, serviço, tabela, engine ou infraestrutura sem uso real.
- Reutilizar estruturas existentes quando forem adequadas.
- Preservar funcionalidades já aprovadas.
- Não reconstruir módulos funcionais sem necessidade comprovada.

Ausência de evidência nunca significa PASS.

Tudo que não puder ser comprovado deve ser classificado como:

NOT PROVEN.

---

## 4. Fonte de verdade

Cada conceito de negócio deve possuir uma fonte canônica.

Não criar uma segunda fonte de verdade apenas para facilitar:

- Dashboard;
- Agenda;
- Central Operacional;
- alertas;
- relatórios;
- obrigações;
- integrações.

Camadas operacionais podem:

- referenciar a fonte;
- acompanhar responsabilidade;
- registrar prazo;
- guardar histórico;
- controlar próxima ação.

Não devem duplicar valores de negócio que pertencem à origem.

Exemplos:

- conta financeira continua sendo fonte do valor financeiro;
- funcionário continua sendo fonte do vínculo;
- Folha continua sendo fonte dos lançamentos;
- processo de desligamento continua sendo fonte do desligamento.

Dados derivados devem ser recalculáveis ou possuir vínculo/versionamento claro.

---

## 5. Redução de dependência da memória humana

Quando o sistema já possui informação suficiente para determinar:

- uma obrigação;
- um risco;
- uma próxima ação;
- um prazo;
- uma dependência;
- uma consequência;

não transferir essa responsabilidade ao usuário por meio de cadastro manual redundante.

Evitar fluxos do tipo:

evento já registrado
→ usuário precisa lembrar
→ usuário cria manualmente uma tarefa sobre o mesmo evento.

Preferir:

evento
→ sistema identifica a obrigação
→ sistema acompanha
→ usuário age quando necessário.

Automação deve reduzir esquecimento, não esconder decisões importantes.

---

## 6. Git

Trabalhar somente em branch explicitamente definida.

Nunca fazer push direto na main.

Um lote correlato deve produzir um histórico claro.

Promoções devem usar:

- PR;
- checks;
- merge normal.

Nunca usar sem autorização explícita:

- git clean;
- reset destrutivo;
- reset --hard;
- amend;
- rebase;
- force push;
- cherry-pick;
- git add .;
- git add -A.

Sempre:

- preservar stash;
- preservar arquivos não rastreados;
- adicionar somente arquivos do lote;
- registrar SHA relevante nos checkpoints.

---

## 7. /DEBUG antes de corrigir

Quando houver:

- erro;
- inconsistência;
- regressão;
- comportamento inesperado;
- divergência entre ambientes;
- suspeita de problema;

usar /DEBUG antes de alterar.

Fluxo:

1. reproduzir;
2. identificar causa;
3. reunir evidência;
4. localizar arquivos diretamente envolvidos;
5. separar causa de sintoma;
6. determinar impacto;
7. somente depois corrigir.

Não alterar código baseado apenas em hipótese.

Se a causa não estiver comprovada:
continuar em /DEBUG.

Evitar varredura ampla do repositório quando o escopo já estiver conhecido.

---

## 8. Implementação e refactor

Depois da causa ou necessidade estar comprovada:

- fazer mudança pequena e correlata;
- resolver causa, não apenas sintoma;
- preservar contratos válidos;
- reutilizar estruturas adequadas;
- evitar abstrações prematuras;
- evitar infraestrutura genérica para problema específico.

Se a solução exigir mudança estrutural fora do escopo:

1. parar;
2. explicar;
3. demonstrar necessidade;
4. aguardar autorização.

Não transformar uma correção pequena em reestruturação ampla.

---

## 9. Checkpoint e rollback

Antes de operação de risco registrar:

- branch;
- SHA;
- git status;
- ambiente;
- estado funcional conhecido.

Operações de risco incluem:

- migration;
- alteração estrutural de banco;
- mutação relevante;
- alteração de permissões;
- mudança de configuração;
- merge;
- deploy;
- promoção.

Sempre que aplicável, definir previamente rollback reversível.

Se houver quebra:

1. parar novas alterações;
2. identificar impacto;
3. verificar mutações ocorridas;
4. restaurar estado estável por método não destrutivo;
5. comprovar restauração;
6. registrar causa;
7. somente então continuar.

Nunca empilhar correções sobre estado quebrado.

---

## 10. Segurança e ambientes

Produção só pode ser alterada com autorização explícita do usuário para aquele lote.

Não alterar sem autorização:

- Supabase;
- migrations;
- Edge Functions;
- variáveis;
- dados;
- permissões;
- configuração;
- deploy de produção.

Antes de qualquer escrita:

- confirmar ambiente;
- confirmar project ref;
- confirmar intenção do lote.

Mudança funcional ou de banco deve ser validada primeiro em staging, salvo autorização excepcional explícita.

Nunca:

- solicitar senha;
- registrar segredo;
- exibir segredo;
- usar segredo em log;
- usar mock como prova final de funcionalidade conectada.

---

## 11. Banco de dados

Antes de criar:

- tabela;
- coluna;
- índice;
- constraint;
- RPC;
- trigger;
- policy;
- migration;

verificar se a estrutura existente já resolve o problema.

Preservar:

- tenant;
- RLS;
- histórico;
- auditoria;
- integridade referencial.

Não:

- afrouxar RLS para facilitar teste;
- remover proteção existente sem causa;
- fazer DELETE físico quando o domínio usa arquivamento lógico;
- usar SQL manual como atalho para fluxo oficial;
- duplicar estado de negócio em estruturas paralelas;
- criar migration não autorizada.

Migration necessária mas não autorizada:
PARAR e pedir autorização.

---

## 12. Regras críticas devem ser autoritativas

Regra crítica de negócio não pode depender exclusivamente da interface.

Frontend pode:

- orientar;
- explicar;
- bloquear botão;
- mostrar consequência.

Mas a operação autoritativa deve impedir estado inválido também no backend.

Exemplos genéricos:

- conclusão de processo com condição crítica pendente;
- alteração incompatível de status;
- mutação sem permissão;
- duplicidade proibida;
- resolução sem evidência obrigatória.

Nenhum caminho alternativo deve conseguir contornar uma trava crítica apenas porque não passou pela tela principal.

---

## 13. Idempotência e duplicidade

Automações e operações repetíveis devem ser idempotentes quando aplicável.

A mesma origem/regra não pode criar múltiplos registros equivalentes por:

- reload;
- retry;
- job repetido;
- clique repetido;
- concorrência;
- reconexão.

Sempre que o domínio exigir unicidade lógica:

- identificar a chave funcional;
- proteger contra duplicidade no nível adequado;
- testar repetição;
- preservar auditoria.

Não depender apenas de “o frontend não chamar duas vezes”.

---

## 14. Automação

Automação deve ser:

- previsível;
- auditável;
- idempotente;
- reversível quando aplicável;
- baseada em fonte confiável.

Automação não deve:

- esconder erro;
- concluir processo crítico silenciosamente;
- criar duplicidade;
- transformar hipótese em fato;
- alterar histórico sem rastreabilidade.

Alertas e notificações são canais.

Não são a fonte de verdade da obrigação.

Falha de e-mail, push ou outro canal não pode apagar a pendência operacional.

---

## 15. Responsabilidade operacional

Em processos que exigem acompanhamento, o sistema deve saber quando aplicável:

- quem é responsável;
- o que precisa acontecer;
- até quando;
- quem está sendo aguardado;
- qual é a próxima ação;
- quando revisar novamente.

“Aguardando terceiro” não significa “sem responsável”.

Se existir dependência externa, deve existir responsabilidade interna pelo acompanhamento.

Não inventar responsáveis quando a estrutura atual não os define.

Se o modelo existente não suportar responsabilidade suficiente:
classificar como gap e propor solução mínima.

---

## 16. Estados e status

Status devem representar consequência real.

Evitar criar estados apenas para organização visual.

Para cada estado perguntar:

- o que muda?
- o que fica permitido?
- o que fica bloqueado?
- qual é a próxima ação?
- existe prazo?
- existe responsável?

Não misturar desnecessariamente:

- estado de negócio;
- prioridade;
- severidade;
- urgência;
- snooze;
- vencimento.

Adiar uma atenção não significa alterar o estado real da obrigação.

---

## 17. UX e linguagem

O usuário não deve precisar conhecer:

- tabela;
- RPC;
- constraint;
- arquitetura;
- nome interno de status;
- organização técnica do sistema.

A interface deve falar a linguagem da operação.

Uma tela ou cartão importante deve permitir compreender:

1. o que aconteceu;
2. por que importa;
3. o que precisa ser feito;
4. onde agir;
5. o que acontece depois.

A ação principal deve ser evidente.

Evitar exigir sequência desnecessária do tipo:

alerta
→ módulo
→ lista
→ registro
→ aba
→ seção
→ ação.

Quando possível:
levar diretamente ao ponto de resolução.

---

## 18. Teste do usuário novo

Para nova feature, novo processo ou mudança relevante de UX, avaliar:

Uma pessoa que não participou do desenvolvimento consegue:

- entender o que está acontecendo?
- identificar criticidade?
- saber o que precisa fazer?
- localizar a ação correta?
- entender o que acontecerá depois?

Se o usuário precisar conhecer a arquitetura interna para concluir uma tarefa comum, o fluxo precisa ser revisto.

Não exigir este teste para correções técnicas sem impacto de UX.

---

## 19. Teste das 72 horas

Para processos operacionais críticos, avaliar:

Se o responsável ficar 72 horas sem acessar o DNA Gestão, ao retornar consegue identificar:

- o que aconteceu;
- o que venceu;
- o que se tornou crítico;
- o que está aguardando terceiro;
- o que foi bloqueado;
- o que mudou;
- qual é a próxima ação?

Um risco não pode ficar invisível apenas porque o usuário não abriu um módulo específico.

Esse teste é critério de produto, não obrigação de criar alerta externo em toda funcionalidade.

---

## 20. Próxima ação

Processos importantes devem, quando aplicável, deixar clara a próxima ação.

Evitar estados finais vagos como:

- em andamento;
- pendente;
- aberto;

sem contexto adicional.

Se um processo está parado, deve ser possível determinar:

- por quê;
- quem precisa agir;
- quando agir;
- o que libera a próxima etapa.

---

## 21. Evidência e resolução

“Concluído” ou “Resolvido” deve ter significado proporcional ao risco.

A evidência pode ser:

- decisão registrada;
- data;
- usuário;
- vínculo financeiro;
- documento;
- referência;
- retorno externo;
- outro dado estruturado.

Nem toda ação exige upload.

Não burocratizar processos simples.

Quanto maior o risco da conclusão incorreta, maior deve ser a qualidade da evidência exigida.

Não resolver uma obrigação operacional sem resolver ou classificar corretamente sua fonte.

---

## 22. Mudança posterior e reabertura

Quando uma informação relevante muda depois de uma conferência ou conclusão intermediária, avaliar se o processo deve:

- ser marcado como desatualizado;
- gerar nova obrigação;
- reabrir etapa;
- exigir nova conferência.

Não depender da memória do usuário para perceber mudança relevante.

Não reabrir processo por edição irrelevante.

Preservar histórico das decisões anteriores.

---

## 23. Dados históricos e cutover

Ao introduzir nova automação, regra ou motor operacional:

não assumir que todo histórico existente deve ser convertido automaticamente.

Antes de backfill:

1. identificar dados históricos;
2. avaliar qualidade;
3. avaliar risco de falsos alertas;
4. definir estratégia de cutover;
5. separar histórico de eventos novos.

Quando necessário, usar revisão humana para transformar histórico em obrigação ativa.

Não criar centenas de pendências automaticamente apenas porque tecnicamente é possível.

---

## 24. Passivo, histórico e operação corrente

Não misturar dívida histórica conhecida com obrigação corrente apenas porque ambas estão vencidas.

Quando houver conceito de passivo acompanhado:

- a fonte financeira continua sendo a conta original;
- não duplicar saldo;
- não criar segunda dívida;
- acompanhamento deve referenciar a origem;
- risco histórico não deve esconder nova urgência;
- nova urgência não deve apagar passivo antigo.

Estados operacionais de acompanhamento não substituem o estado financeiro real.

---

## 25. Recorrências e expectativas

Recorrência representa expectativa periódica, não autorização para criar duplicidade.

Quando existir uma cobrança real que possivelmente corresponde à ocorrência prevista:

- comparar;
- identificar possível correspondência;
- permitir conciliação;
- evitar obrigação financeira duplicada.

Não assumir que mesmo fornecedor significa mesma obrigação.

Não assumir que valor diferente significa obrigação diferente.

Analisar contexto.

---

## 26. Arquitetura de interface

Mobile, tablet e desktop devem preservar:

- mesmas regras de negócio;
- mesmos dados relevantes;
- mesmas permissões;
- mesmos resultados funcionais.

Layout pode variar conforme viewport.

DOM idêntico não é obrigatório quando uma estrutura diferente melhora a experiência sem alterar regra ou comportamento.

Preferir componentes compartilhados quando fizer sentido.

Não duplicar regra de negócio por breakpoint.

CSS:

- compartilhado deve usar classes próprias;
- domínio deve permanecer escopado;
- evitar !important;
- evitar posicionamento absoluto estrutural;
- evitar seletores globais frágeis;
- evitar inline style para layout estático quando CSS resolver melhor.

---

## 27. Organização dos lotes

Correções:
agrupar pela causa técnica.

Features/processos:
agrupar por capacidade operacional coerente e fonte de verdade.

Não misturar demandas independentes apenas para reduzir número de lotes.

Antes de editar:

- identificar arquivos;
- identificar contratos;
- identificar fonte de verdade;
- identificar impacto;
- identificar critérios de aceite.

Não transformar um lote em “aproveitar e corrigir”.

Achado fora do escopo:
registrar e separar.

---

## 28. Economia de validação

Regra:

não repetir checkpoint já aprovado sem novo diff capaz de afetá-lo.

Durante o lote:

- testes focados;
- git diff --check.

No fechamento de alteração funcional relevante:

- suíte completa;
- build;
- viewports realmente afetados;
- E2E quando necessário.

Se não houve novo diff:

não repetir automaticamente:

- suíte;
- build;
- staging;
- smoke;
- viewports.

Se houver novo diff:
revalidar somente o impacto possível.

Validação deve ser proporcional ao risco.

---

## 29. Critério de entrega funcional

Antes de declarar funcionalidade pronta, comprovar quando aplicável:

1. dados/serviços reais;
2. loading;
3. erro;
4. estado vazio;
5. ação ponta a ponta;
6. persistência após reload;
7. tenant e segurança;
8. ausência de regressão relevante;
9. comportamento nos viewports afetados.

Se item necessário não puder ser comprovado:
NOT PROVEN.

---

## 30. Critério de entrega operacional

Para processo operacional relevante, responder quando aplicável:

1. O que inicia o processo?
2. O que o sistema cria automaticamente?
3. Qual é a próxima ação?
4. Quem é responsável?
5. Existe prazo?
6. Existe terceiro sendo aguardado?
7. O que acontece se ninguém agir?
8. Como o risco reaparece?
9. O que fica bloqueado?
10. Qual evidência comprova resolução?
11. Para qual módulo ou processo o resultado segue?
12. O que acontece se a informação mudar depois?
13. O usuário precisa lembrar manualmente de algo que o sistema já poderia saber?

Se essas respostas forem necessárias ao processo e não estiverem definidas:
a funcionalidade não está operacionalmente pronta.

---

## 31. Staging

Mudanças funcionais devem ser validadas em staging antes da promoção.

Fixture somente quando necessária.

Fixtures:

- seguras;
- identificáveis;
- isoladas;
- encerradas por arquivamento lógico quando aplicável;
- sem dados ativos desnecessários ao final.

Não criar fixture se prova equivalente puder ser feita sem mutação.

Registrar mutações relevantes realizadas durante E2E.

---

## 32. Produção

Smoke de produção deve ser mínimo.

Preferir read-only.

Não repetir mutações funcionais já provadas em staging apenas para obter novo PASS em produção.

DML real de teste em produção exige:

- necessidade comprovada;
- autorização explícita;
- escopo controlado;
- rollback ou encerramento definido.

Produção não é ambiente de experimentação.

---

## 33. Promoção

Quando staging já estiver aprovado e não houver novo diff, usar três gates.

### Gate 1 — Git

- git fetch;
- verificar drift;
- analisar somente impacto relevante.

Sem impacto:
não repetir staging.

### Gate 2 — PR

- abrir PR;
- conferir escopo;
- aguardar checks;
- merge normal.

Não usar:

- squash;
- rebase;
- push direto na main.

### Gate 3 — Produção

- confirmar SHA;
- confirmar ambiente;
- aplicar somente migrations autorizadas;
- confirmar deployment correto;
- confirmar READY;
- confirmar HTTP;
- confirmar backend;
- smoke mínimo.

Não ampliar escopo durante promoção.

---

## 34. Regressões durante promoção

Se surgir erro:

1. parar;
2. entrar em /DEBUG;
3. identificar origem;
4. separar migration, deploy, contrato, auth, dados ou drift;
5. corrigir somente após causa comprovada.

Não repetir todo o ciclo automaticamente.

Se main avançou:
analisar apenas o novo diff e seu impacto.

Em conflito:
resolver pela intenção funcional.

Nunca escolher ours/theirs para arquivo inteiro sem análise.

---

## 35. Regras legais e externas

Não inventar:

- prazo legal;
- obrigação legal;
- interpretação jurídica;
- requisito fiscal;
- requisito trabalhista.

Quando regra externa for crítica:

- usar fonte oficial ou decisão de negócio validada;
- registrar origem/configuração quando aplicável;
- separar prazo legal de margem operacional interna.

Dúvida:
NOT PROVEN.

Não transformar hipótese jurídica em constraint de banco.

---

## 36. Relatório final

Relatório deve ser curto e decisório.

Informar somente quando aplicável:

- branch;
- SHA inicial/final;
- arquivos alterados;
- causa ou necessidade comprovada;
- alteração realizada;
- migrations;
- testes;
- build;
- E2E;
- ambiente;
- mutações;
- PASS / FAIL / NOT PROVEN;
- pendências reais;
- preservação de stash/untracked.

Não repetir toda a história do projeto.

---

## 37. Regra final

O DNA Gestão não deve apenas registrar o que aconteceu.

Ele deve ajudar a conduzir o que precisa acontecer.

Antes de entregar qualquer processo importante, perguntar:

> Uma pessoa comum consegue entender o que precisa fazer agora, e o sistema perceberá se isso não for feito?

Se a resposta for não, revisar o desenho antes de ampliar o código.

Diagnosticar uma vez.
Resolver a causa.
Preservar a fonte de verdade.
Automatizar somente o que é confiável.
Validar proporcionalmente.
Não esconder risco.
Não depender da memória humana quando o sistema já possui informação suficiente.
