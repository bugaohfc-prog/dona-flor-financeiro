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

O resumo fiscal no card exibe razão social, nome fantasia, CNPJ, localidade e endereço em linhas separadas para manter leitura adequada no mobile.

O campo CNPJ aceita digitação com ou sem máscara, exibe no padrão `00.000.000/0000-00` e bloqueia apenas CNPJ preenchido com quantidade diferente de 14 dígitos. CNPJ vazio continua permitido para filiais sem cadastro fiscal confirmado.
