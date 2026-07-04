# Cadastro fiscal de filiais V1

## Decisão

`df_empresas` continua representando o grupo ou rede, como Rede Dona Flor e Choco Arte.

`df_filiais` passa a concentrar os dados fiscais e cadastrais da unidade operacional, porque CNPJ, cidade, UF e endereço variam por filial.

## Campos adicionados em `public.df_filiais`

- `razao_social`
- `nome_fantasia`
- `cnpj`
- `inscricao_estadual`
- `endereco`
- `numero`
- `complemento`
- `bairro`
- `cidade`
- `uf`
- `cep`
- `telefone`
- `email`
- `updated_at`

Todos os campos foram criados como nullable para não quebrar registros existentes.

## RLS

A migration não altera RLS ou policies. As policies existentes de `df_filiais` seguem filtrando por vínculo do usuário com `empresa_id`.

## Tela

A tela V1 de Filiais / Unidades lista e permite editar os campos fiscais da filial, preservando o fluxo existente de nome operacional e status ativo/inativo.
