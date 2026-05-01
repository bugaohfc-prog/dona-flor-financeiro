Dona Flor V22.4 - Relatório integrado CSV/PDF

Análise:
- O CSV estava dependendo dos dados já renderizados na tela.
- Agora o relatório busca direto no Supabase quando possível.
- Se o Supabase não responder, usa fallback local.

Correções:
- CSV com integração real com dados do banco.
- CSV usa compartilhamento nativo no celular quando disponível.
- CSV tem link fallback caso o download não inicie.
- PDF não usa iframe nem página externa.
- PDF imprime apenas um container limpo do relatório.
- Remove página branca e página com código.
- Mantém somente o select Exportar na tela principal.

SQL:
- Não precisa SQL.
