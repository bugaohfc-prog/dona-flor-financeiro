# Ajustes desktop validados

Base: último ZIP enviado nesta conversa.

Alterações realizadas:
- Sidebar desktop alinhada, com ícones/textos em grid e controle visual de expandir/recolher preservado.
- Botão hambúrguer oculto de forma definitiva em desktop por media query >= 980px.
- Modal de Nova Conta e Editar Conta usando o mesmo bloco de recorrência.
- Editar Conta carrega recorrência existente em `df_contas_recorrentes` quando houver `recorrencia_id`.
- Editar Conta atualiza, cria ou desativa recorrência conforme o estado do checkbox.
- Configurações ganhou bloco informativo de Recorrências.
- Gestão de usuários recebeu refinamento visual desktop: cards mais leves, espaçamentos, guia de permissões em colunas e botões menos pesados.

Validação:
- `npm run build` executado e o Vite gerou `dist/index.html` e assets com sucesso.
- Aviso mantido do Vite: bundle JS acima de 500 kB. Não é erro de build.

Observação:
- Ajustes visuais foram isolados em `@media (min-width: 980px)` para preservar a fase mobile.
