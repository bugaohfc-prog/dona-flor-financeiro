import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const migration = fs.readFileSync(
  path.join(raiz, 'supabase/migrations/20260928005721_internalizar_usuario_alvo_master.sql'),
  'utf8'
)

test('helper de alvo Master sai do schema exposto sem perder o uso interno', () => {
  assert.match(migration, /create schema if not exists private authorization postgres/i)
  assert.match(migration, /create or replace function private\.df_usuario_alvo_eh_master/i)
  assert.match(migration, /security definer[\s\S]+set search_path = ''/i)
  assert.doesNotMatch(migration, /pg_catalog\.coalesce/i)
  assert.match(migration, /revoke execute on function public\.df_usuario_alvo_eh_master\(uuid, text, uuid\)[\s\S]+from public, anon, authenticated/i)
  assert.doesNotMatch(migration, /grant execute on function public\.df_usuario_alvo_eh_master[\s\S]+authenticated/i)
  assert.match(migration, /grant execute on function private\.df_usuario_alvo_eh_master\(uuid, text, uuid\)[\s\S]+to authenticated/i)
})

test('policies e RPC dependentes usam somente o helper interno', () => {
  const policies = [
    'df_usuarios_empresas_insert_admin_saneado',
    'df_usuarios_empresas_update_admin_saneado',
    'df_usuarios_empresas_delete_admin_saneado'
  ]

  for (const policy of policies) {
    const inicio = migration.indexOf(`create policy "${policy}"`)
    assert.notEqual(inicio, -1)
    const proximoBloco = migration.indexOf('\ndrop policy ', inicio)
    const fim = proximoBloco === -1
      ? migration.indexOf('\ncreate or replace function public.definir_escopo_filiais_usuario', inicio)
      : proximoBloco
    const definicao = migration.slice(inicio, fim)
    assert.match(definicao, /private\.df_usuario_alvo_eh_master/)
    assert.doesNotMatch(definicao, /public\.df_usuario_alvo_eh_master/)
  }

  const inicioRpc = migration.indexOf('create or replace function public.definir_escopo_filiais_usuario')
  const fimRpc = migration.indexOf('\nrevoke execute on function public.df_usuario_alvo_eh_master', inicioRpc)
  const rpc = migration.slice(inicioRpc, fimRpc)
  assert.match(rpc, /private\.df_usuario_alvo_eh_master/)
  assert.doesNotMatch(rpc, /public\.df_usuario_alvo_eh_master/)
})

test('migration possui preflight, validacao final e transacao unica', () => {
  assert.match(migration, /^begin;/i)
  assert.match(migration, /Policies esperadas de df_usuarios_empresas ausentes/)
  assert.match(migration, /authenticated ainda executa o helper publico/)
  assert.match(migration, /Policies nao usam integralmente o helper interno/)
  assert.match(migration, /commit;\s*$/i)
})
