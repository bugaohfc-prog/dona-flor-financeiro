import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const raiz = process.cwd()
const migrationPagamento = fs.readFileSync(
  path.join(raiz, 'supabase/migrations/20260730183313_registrar_pagamento_parcial_controlado.sql'),
  'utf8'
).replace(/\r\n/g, '\n')
const migrationArquivamentoPagamento = fs.readFileSync(
  path.join(raiz, 'supabase/migrations/20260730213000_proteger_arquivamento_pagamento_parcial.sql'),
  'utf8'
).replace(/\r\n/g, '\n')
const migrationLixeira = fs.readFileSync(
  path.join(raiz, 'supabase/migrations/20260730184527_proteger_exclusao_definitiva_lixeira.sql'),
  'utf8'
).replace(/\r\n/g, '\n')
const migrationFiliais = fs.readFileSync(
  path.join(raiz, 'supabase/migrations/20260730190640_aplicar_escopo_financeiro_por_filial.sql'),
  'utf8'
).replace(/\r\n/g, '\n')
const migrationRecorrencias = fs.readFileSync(
  path.join(raiz, 'supabase/migrations/20260730194700_restringir_mutacoes_recorrencias_admin.sql'),
  'utf8'
).replace(/\r\n/g, '\n')
const contasServiceFonte = fs.readFileSync(path.join(raiz, 'src/services/contasService.js'), 'utf8')
const notasServiceFonte = fs.readFileSync(path.join(raiz, 'src/services/notasService.js'), 'utf8')
const usuariosServiceFonte = fs.readFileSync(path.join(raiz, 'src/services/usuariosService.js'), 'utf8')
const useContasFonte = fs.readFileSync(path.join(raiz, 'src/hooks/useContas.js'), 'utf8')
const appFonte = fs.readFileSync(path.join(raiz, 'src/App.jsx'), 'utf8')
const usuariosPageFonte = fs.readFileSync(path.join(raiz, 'src/pages/UsuariosPage.jsx'), 'utf8')
const recorrenciasPageFonte = fs.readFileSync(
  path.join(raiz, 'src/pages/RecorrenciasFinanceirasPage.jsx'),
  'utf8'
)
const accountModalFonte = fs.readFileSync(
  path.join(raiz, 'src/components/modals/AccountModal.jsx'),
  'utf8'
)
const modalPagamentoFonte = fs.readFileSync(
  path.join(raiz, 'src/components/modals/AccountPartialPaymentModal.jsx'),
  'utf8'
)

test('P0-1 usa RPC transacional com bloqueio da conta e idempotencia por empresa', () => {
  assert.match(migrationPagamento, /registrar_pagamento_parcial_controlado/)
  assert.match(migrationPagamento, /for update/i)
  assert.match(migrationPagamento, /uq_df_contas_pagamentos_empresa_idempotency/)
  assert.match(migrationPagamento, /empresa_id, idempotency_key/)
  assert.match(migrationPagamento, /v_valor > v_saldo/)
})

test('P0-1 registra auditoria na mesma funcao transacional', () => {
  const inicioFuncao = migrationPagamento.indexOf('create or replace function public.registrar_pagamento_parcial_controlado')
  const fimFuncao = migrationPagamento.indexOf('revoke all on function public.registrar_pagamento_parcial_controlado')
  const corpo = migrationPagamento.slice(inicioFuncao, fimFuncao)
  assert.match(corpo, /insert into public\.df_auditoria_eventos/)
  assert.match(corpo, /financeiro\.pagamento_parcial\.criado/)
})

test('P0-1 remove INSERT direto e policy paralela de pagamentos', () => {
  assert.match(migrationPagamento, /revoke insert on table public\.df_contas_pagamentos from authenticated/i)
  assert.match(migrationPagamento, /drop policy if exists "df_contas_pagamentos_insert_empresa_operacional"/i)
})

test('P0-1 frontend usa somente a RPC protegida para criar pagamento parcial', async () => {
  const { registrarPagamentoParcial } = await import(
    `${pathToFileURL(path.join(raiz, 'src/services/contasService.js')).href}?p0=${Date.now()}`
  )
  const chamadas = []
  const supabase = {
    rpc: async (nome, payload) => {
      chamadas.push({ nome, payload })
      return {
        data: {
          pagamento: { id: 'pagamento-1', valor_pago: 80 },
          idempotente: false,
          auditoria_registrada: true
        },
        error: null
      }
    },
    from: () => {
      throw new Error('INSERT direto nao pode ser usado')
    }
  }

  const resposta = await registrarPagamentoParcial(supabase, 'conta-1', 'empresa-1', {
    valor_pago: 80,
    data_pagamento: '2026-07-30',
    observacao: null,
    idempotency_key: '11111111-1111-4111-8111-111111111111'
  })

  assert.equal(resposta.error, null)
  assert.equal(chamadas.length, 1)
  assert.equal(chamadas[0].nome, 'registrar_pagamento_parcial_controlado')
  assert.equal(chamadas[0].payload.p_idempotency_key, '11111111-1111-4111-8111-111111111111')
})

test('P0-1 reutiliza a mesma chave durante a tentativa logica no modal', () => {
  assert.match(modalPagamentoFonte, /useRef\(globalThis\.crypto\.randomUUID\(\)\)/)
  assert.match(modalPagamentoFonte, /idempotency_key: idempotencyKeyRef\.current/)
  assert.match(modalPagamentoFonte, /idempotencyKeyRef\.current = globalThis\.crypto\.randomUUID\(\)/)
})

test('P0-1 chamadas repetidas e simultaneas preservam a mesma identidade logica', async () => {
  const { registrarPagamentoParcial } = await import(
    `${pathToFileURL(path.join(raiz, 'src/services/contasService.js')).href}?concorrencia=${Date.now()}`
  )
  const pagamentosPorChave = new Map()
  const supabase = {
    rpc: async (_nome, payload) => {
      await Promise.resolve()
      const existente = pagamentosPorChave.get(payload.p_idempotency_key)
      if (existente) {
        return { data: { pagamento: existente, idempotente: true, auditoria_registrada: true }, error: null }
      }
      const criado = { id: 'pagamento-unico', valor_pago: payload.p_valor }
      pagamentosPorChave.set(payload.p_idempotency_key, criado)
      return { data: { pagamento: criado, idempotente: false, auditoria_registrada: true }, error: null }
    }
  }
  const tentativa = {
    valor_pago: 80,
    data_pagamento: '2026-07-30',
    idempotency_key: '22222222-2222-4222-8222-222222222222'
  }

  const [primeira, repetida] = await Promise.all([
    registrarPagamentoParcial(supabase, 'conta-1', 'empresa-1', tentativa),
    registrarPagamentoParcial(supabase, 'conta-1', 'empresa-1', tentativa)
  ])

  assert.equal(primeira.data[0].id, repetida.data[0].id)
  assert.equal(pagamentosPorChave.size, 1)
})

test('P0-1 hook nao dispara auditoria separada depois da escrita', () => {
  assert.doesNotMatch(useContasFonte, /registrarAuditoriaPagamentoParcialCriado/)
  assert.doesNotMatch(contasServiceFonte, /functions\.invoke\('registrar-auditoria-evento'/)
  assert.doesNotMatch(useContasFonte, /financeiro\.pagamento_parcial\.estornado/)
})

test('P0-1 remove UPDATE direto e qualquer policy paralela de pagamentos', () => {
  assert.match(
    migrationArquivamentoPagamento,
    /revoke update on table public\.df_contas_pagamentos from authenticated/i
  )
  assert.match(
    migrationArquivamentoPagamento,
    /drop policy if exists "df_contas_pagamentos_update_empresa_operacional"/i
  )
  assert.match(
    migrationArquivamentoPagamento,
    /has_table_privilege\([\s\S]+authenticated[\s\S]+df_contas_pagamentos[\s\S]+UPDATE/i
  )
  assert.match(
    migrationArquivamentoPagamento,
    /cmd in \('UPDATE', 'ALL'\)/
  )
})

test('P0-1 arquivamento usa RPC transacional limitada aos campos de estado', async () => {
  const { estornarPagamentoParcial } = await import(
    `${pathToFileURL(path.join(raiz, 'src/services/contasService.js')).href}?arquivamento=${Date.now()}`
  )
  const chamadas = []
  const supabase = {
    rpc: async (nome, payload) => {
      chamadas.push({ nome, payload })
      return {
        data: {
          pagamento: {
            id: payload.p_pagamento_id,
            conta_id: payload.p_conta_id,
            arquivado: true,
            arquivado_em: '2026-07-30T21:30:00.000Z'
          },
          idempotente: false,
          auditoria_registrada: true
        },
        error: null
      }
    },
    from: () => {
      throw new Error('UPDATE direto nao pode ser usado')
    }
  }

  const resposta = await estornarPagamentoParcial(
    supabase,
    'pagamento-1',
    'conta-1',
    'empresa-1'
  )

  assert.equal(resposta.error, null)
  assert.equal(resposta.data.arquivado, true)
  assert.deepEqual(chamadas, [{
    nome: 'definir_arquivamento_pagamento_parcial',
    payload: {
      p_empresa_id: 'empresa-1',
      p_conta_id: 'conta-1',
      p_pagamento_id: 'pagamento-1',
      p_arquivado: true
    }
  }])
})

test('P0-1 RPC revalida tenant, permissao, filial e audita na mesma transacao', () => {
  const inicio = migrationArquivamentoPagamento.indexOf(
    'create or replace function public.definir_arquivamento_pagamento_parcial'
  )
  const fim = migrationArquivamentoPagamento.indexOf(
    'revoke all on function public.definir_arquivamento_pagamento_parcial'
  )
  const corpo = migrationArquivamentoPagamento.slice(inicio, fim)

  assert.match(corpo, /public\.df_usuario_eh_admin\(p_empresa_id\)/)
  assert.match(corpo, /public\.df_usuario_tem_perfil_empresa\(p_empresa_id, array\['gerente'\]\)/)
  assert.match(corpo, /c\.id = p_conta_id[\s\S]+c\.empresa_id = p_empresa_id[\s\S]+for update/i)
  assert.match(corpo, /p\.id = p_pagamento_id[\s\S]+p\.empresa_id = p_empresa_id[\s\S]+p\.conta_id = p_conta_id[\s\S]+for update/i)
  assert.match(corpo, /public\.df_usuario_pode_acessar_filial/)
  const inicioUpdate = corpo.indexOf('update public.df_contas_pagamentos')
  const fimUpdate = corpo.indexOf('returning * into v_pagamento', inicioUpdate)
  const updatePagamento = corpo.slice(inicioUpdate, fimUpdate)
  const setPagamento = updatePagamento.slice(
    updatePagamento.indexOf('set '),
    updatePagamento.indexOf('where ')
  )
  assert.match(updatePagamento, /set arquivado = p_arquivado,\s+arquivado_em = v_arquivado_em/)
  assert.doesNotMatch(
    setPagamento,
    /(valor_pago|conta_id|empresa_id|data_pagamento|idempotency_key)\s*=/i
  )
  assert.match(corpo, /insert into public\.df_auditoria_eventos/)
})

test('P0-2 RPCs bloqueiam registros e revalidam a retencao de 60 dias', () => {
  assert.match(migrationLixeira, /create or replace function public\.excluir_conta_definitivamente/)
  assert.match(migrationLixeira, /create or replace function public\.excluir_nota_definitivamente/)
  assert.equal((migrationLixeira.match(/for update/gi) || []).length, 2)
  assert.equal((migrationLixeira.match(/now\(\) - interval '60 days'/gi) || []).length, 2)
})

test('P0-2 auditoria obrigatoria permanece na mesma transacao das exclusoes', () => {
  assert.match(migrationLixeira, /trg_df_contas_auditoria_lixeira/)
  assert.match(migrationLixeira, /trg_df_notas_auditoria_lixeira/)
  assert.match(migrationLixeira, /begin;[\s\S]+delete from public\.df_contas[\s\S]+delete from public\.df_notas[\s\S]+commit;/i)
})

test('P0-2 remove grants e policies de DELETE direto sem caminho paralelo', () => {
  assert.match(migrationLixeira, /revoke delete on table public\.df_contas from authenticated/i)
  assert.match(migrationLixeira, /revoke delete on table public\.df_notas from authenticated/i)
  assert.match(migrationLixeira, /drop policy if exists "df_contas_delete_admin_master"/i)
  assert.match(migrationLixeira, /drop policy if exists "df_notas_delete_admin_master"/i)
  assert.doesNotMatch(appFonte, /\.from\(['"]df_contas['"]\)[\s\S]{0,300}\.delete\(\)/)
  assert.doesNotMatch(notasServiceFonte, /\.from\(['"]df_notas['"]\)[\s\S]{0,300}\.delete\(\)/)
})

test('P0-2 frontend chama somente as RPCs controladas para exclusao definitiva', async () => {
  const { excluirContaPermanentemente } = await import(
    `${pathToFileURL(path.join(raiz, 'src/services/contasService.js')).href}?lixeira=${Date.now()}`
  )
  const chamadas = []
  const supabase = {
    rpc: async (nome, payload) => {
      chamadas.push({ nome, payload })
      return { data: { id: payload.p_conta_id, excluida: true }, error: null }
    },
    from: () => {
      throw new Error('DELETE direto nao pode ser usado')
    }
  }

  const resposta = await excluirContaPermanentemente(supabase, 'conta-1', 'empresa-1')

  assert.equal(resposta.error, null)
  assert.deepEqual(chamadas, [{
    nome: 'excluir_conta_definitivamente',
    payload: { p_empresa_id: 'empresa-1', p_conta_id: 'conta-1' }
  }])
  assert.match(notasServiceFonte, /supabase\.rpc\('excluir_nota_definitivamente'/)
})

test('P0-3 cria flag explicita, preserva vinculos antigos e restringe novos por padrao', () => {
  assert.match(migrationFiliais, /add column if not exists acesso_todas_filiais boolean/)
  assert.match(migrationFiliais, /set acesso_todas_filiais = not exists/)
  assert.match(migrationFiliais, /alter column acesso_todas_filiais set default false/)
  assert.match(migrationFiliais, /alter column acesso_todas_filiais set not null/)
})

test('P0-3 corrige a identidade da atribuicao para o vinculo empresarial', () => {
  assert.match(migrationFiliais, /references public\.df_usuarios_empresas\(id\)/)
  assert.match(migrationFiliais, /uq_df_usuarios_filiais_escopo/)
  assert.match(migrationFiliais, /Existem atribuicoes de filial sem vinculo empresarial correspondente/)
})

test('P0-3 escopo canonico nega registro sem filial para usuario restrito', () => {
  const inicio = migrationFiliais.indexOf('create or replace function public.df_usuario_pode_acessar_filial')
  const fim = migrationFiliais.indexOf('create or replace function public.definir_escopo_filiais_usuario')
  const funcao = migrationFiliais.slice(inicio, fim)
  assert.match(funcao, /public\.is_master\(\)/)
  assert.match(funcao, /public\.df_usuario_eh_admin\(p_empresa_id\)/)
  assert.match(funcao, /ue\.acesso_todas_filiais = true/)
  assert.match(funcao, /p_filial_id is not null[\s\S]+uf\.filial_id = p_filial_id/)
  assert.doesNotMatch(funcao, /p_filial_id is null\s+or/i)
})

test('P0-3 toda policy financeira afetada usa a autoridade canonica de filial', () => {
  for (const tabela of [
    'df_contas',
    'df_notas',
    'df_contas_pagamentos',
    'df_contas_recorrentes',
    'df_receitas'
  ]) {
    assert.match(migrationFiliais, new RegExp(`on public\\.${tabela}[\\s\\S]+df_usuario_pode_acessar_filial`))
  }
  assert.match(migrationFiliais, /policy financeira sem escopo canonico de filial/i)
})

test('P0-3 bypass direto em pagamento parcial tambem valida a filial da conta', () => {
  assert.match(migrationFiliais, /trg_df_contas_pagamentos_validar_escopo_filial/)
  assert.match(migrationFiliais, /before insert or update of empresa_id, conta_id/)
  assert.match(migrationFiliais, /Usuario sem acesso a filial da conta/)
})

test('P0-3 frontend nao infere acesso total pela ausencia de atribuicoes', () => {
  assert.match(usuariosPageFonte, /usuario\.acesso_todas_filiais === true/)
  assert.doesNotMatch(usuariosPageFonte, /acessoTotalFiliais = filiaisSelecionadas\.length === 0/)
  assert.match(usuariosServiceFonte, /\.rpc\('definir_escopo_filiais_usuario'/)
  assert.doesNotMatch(
    usuariosServiceFonte,
    /\.from\('df_usuarios_filiais'\)[\s\S]{0,250}\.(insert|delete)\(/
  )
})

test('P0-4 separa leitura empresarial de mutacoes administrativas', () => {
  assert.match(migrationRecorrencias, /create policy "df_contas_recorrentes_select_empresa"[\s\S]+for select/)
  for (const operacao of ['insert', 'update', 'delete']) {
    assert.match(
      migrationRecorrencias,
      new RegExp(`create policy "df_contas_recorrentes_${operacao}_admin"[\\s\\S]+for ${operacao}[\\s\\S]+df_usuario_eh_admin`)
    )
  }
})

test('P0-4 Gerente e chamada REST direta nao possuem policy paralela de escrita', () => {
  assert.match(migrationRecorrencias, /drop policy if exists "contas_recorrentes_empresa"/)
  assert.doesNotMatch(migrationRecorrencias, /create policy "contas_recorrentes_empresa"/)
  assert.match(migrationRecorrencias, /Policy FOR ALL nao e permitida em recorrencias/)
  assert.match(migrationRecorrencias, /mutacao nao administrativa em recorrencias/)
  assert.doesNotMatch(migrationRecorrencias, /df_usuario_tem_perfil_empresa[\s\S]+gerente/i)
})

test('P0-4 frontend bloqueia criacao e edicao de serie antes de qualquer escrita', () => {
  const inicioSalvar = appFonte.indexOf('async function salvarConta()')
  const fimSalvar = appFonte.indexOf('async function marcarComoPago', inicioSalvar)
  const salvar = appFonte.slice(inicioSalvar, fimSalvar)
  assert.match(salvar, /solicitaMutacaoRecorrencia/)
  assert.match(salvar, /!podeGerenciarRecorrencias\(\)/)
  assert.ok(
    salvar.indexOf('!podeGerenciarRecorrencias()') < salvar.indexOf('salvarContaHook'),
    'a autorização precisa anteceder o fluxo que pode criar a conta'
  )
  assert.match(accountModalFonte, /disabled=\{!podeGerenciarRecorrencias\}/)
  assert.match(accountModalFonte, /disabled=\{!recorrenciaEdicaoCarregada \|\| !podeGerenciarRecorrencias\}/)
})

test('P0-4 gestao de recorrencias revalida Admin ou Master no handler e na pagina', () => {
  assert.match(appFonte, /async function desativarSerieRecorrente[\s\S]+!podeGerenciarRecorrencias\(\)/)
  assert.match(appFonte, /async function reativarSerieRecorrente[\s\S]+!podeGerenciarRecorrencias\(\)/)
  assert.match(recorrenciasPageFonte, /if \(!podeGerenciarRecorrencias\) return/)
  assert.match(recorrenciasPageFonte, /disabled=\{!podeGerenciarRecorrencias\}/)
})

test('P0-4 nao altera geracao nem vinculo controlados existentes', () => {
  assert.doesNotMatch(migrationRecorrencias, /gerar_ocorrencia|vincular_recorrencia|df_contas\s/i)
  assert.match(appFonte, /podeVincularRecorrencia=\{podeVincularRecorrencia\(\)\}/)
  assert.match(appFonte, /podeGerarRecorrencia=\{podeGerarRecorrencia\(\)\}/)
})
