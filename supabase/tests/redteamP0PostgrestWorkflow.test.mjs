import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile('.github/workflows/redteam-p0-postgrest.yml', 'utf8');
const postgrest = await readFile('supabase/tests/redteam_p0_postgrest.mjs', 'utf8');
const playwright = await readFile('supabase/tests/redteam_p0_frontend_playwright.mjs', 'utf8');
const fixture = await readFile('supabase/tests/redteam_p0_postgrest_fixture.sql', 'utf8');

test('workflow PostgREST e manual, efemero e usa CLI fixada', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /runs-on: ubuntu-latest/);
  assert.match(workflow, /version: 2\.110\.0/);
  assert.match(workflow, /supabase start/);
  assert.match(workflow, /supabase migration up --local --include-all/);
  assert.match(workflow, /VITE_SUPABASE_URL=\$API_URL/);
  assert.match(workflow, /VITE_SUPABASE_ANON_KEY=\$ANON_KEY/);
  assert.match(workflow, /redteam_p0_postgrest_fixture\.sql/);
});

test('workflow nao acessa remoto nem possui deploy ou secrets', () => {
  assert.doesNotMatch(workflow, /secrets\./i);
  assert.doesNotMatch(workflow, /vercel/i);
  assert.doesNotMatch(workflow, /supabase\s+(?:db\s+push|link|functions\s+deploy)/i);
  assert.doesNotMatch(workflow, /--linked/i);
});

test('suite usa Auth, PostgREST e RPC reais por HTTP', () => {
  assert.match(postgrest, /\/auth\/v1\/admin\/users/);
  assert.match(postgrest, /\/auth\/v1\/token\?grant_type=password/);
  assert.match(postgrest, /\/rest\/v1\//);
  assert.match(postgrest, /Promise\.all/);
  assert.match(postgrest, /registrar_pagamento_parcial_controlado/);
  assert.match(postgrest, /definir_arquivamento_pagamento_parcial/);
  assert.match(postgrest, /excluir_conta_definitivamente/);
  assert.match(postgrest, /excluir_nota_definitivamente/);
});

test('suite HTTP cobre matriz de filial, NULL, Folha e recorrencias', () => {
  assert.match(postgrest, /filial NULL/);
  assert.match(postgrest, /df_folha_lancamentos/);
  assert.match(postgrest, /df_folha_lancamento_itens/);
  assert.match(postgrest, /gerente nao insere, altera ou exclui recorrencia/);
  assert.match(postgrest, /Admin e Master/);
});

test('fixture sintetica cobre as duas filiais, NULL e Folha sem service_role', () => {
  assert.match(fixture, /Conta HTTP sem filial/);
  assert.match(fixture, /df_folha_lancamentos/);
  assert.match(fixture, /df_folha_lancamento_itens/);
  assert.doesNotMatch(fixture, /auth\.users|service_role/);
});

test('Playwright valida login e telas contra o Supabase efemero', () => {
  assert.match(playwright, /chromium\.launch/);
  assert.match(playwright, /getByPlaceholder\('E-mail'\)/);
  assert.match(playwright, /\?tela=contas/);
  assert.match(playwright, /\?tela=recorrencias/);
  assert.match(playwright, /Conta HTTP B/);
  assert.match(playwright, /Serie HTTP B/);
});
