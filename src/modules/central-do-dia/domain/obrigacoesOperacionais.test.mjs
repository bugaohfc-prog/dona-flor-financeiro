import assert from 'node:assert/strict'
import test from 'node:test'
import {
  filtrarObrigacoesOperacionais,
  normalizarObrigacaoOperacional,
  obrigacaoPrecisaAcao,
  obrigacaoSemResponsavel,
  resumirObrigacoesOperacionais,
  usuarioElegivelObrigacao
} from './obrigacoesOperacionais.js'

const admin = { id: 'vinculo-admin', perfil_original: 'admin', status: 'ativo' }
const operador = { id: 'vinculo-operador', perfil_original: 'operador', status: 'ativo' }

test('somente perfis administrativos ativos sao elegiveis', () => {
  assert.equal(usuarioElegivelObrigacao(admin), true)
  assert.equal(usuarioElegivelObrigacao({ ...admin, status: 'inativo' }), false)
  assert.equal(usuarioElegivelObrigacao(operador), false)
})

test('normaliza joins aninhados sem expor ids tecnicos na regra de exibicao', () => {
  const item = normalizarObrigacaoOperacional({
    desligamento: [{ funcionario_id: 'f1', funcionario: [{ id: 'f1', nome: 'Fixture' }] }],
    responsavel: [{ id: 'vinculo-admin', nome: 'Admin' }]
  })
  assert.equal(item.funcionario.nome, 'Fixture')
  assert.equal(item.responsavel.nome, 'Admin')
})

test('considera sem responsavel quando ausente ou inelegivel', () => {
  assert.equal(obrigacaoSemResponsavel({}, [admin]), true)
  assert.equal(obrigacaoSemResponsavel({ responsavel_usuario_empresa_id: operador.id }, [admin, operador]), true)
  assert.equal(obrigacaoSemResponsavel({ responsavel_usuario_empresa_id: admin.id }, [admin]), false)
})

test('precisa de acao respeita snooze e revisao de terceiro', () => {
  const agora = new Date('2026-10-13T12:00:00Z')
  assert.equal(obrigacaoPrecisaAcao({ estado: 'ABERTA' }, agora), true)
  assert.equal(obrigacaoPrecisaAcao({ estado: 'ABERTA', snooze_ate: '2026-10-13T13:00:00Z' }, agora), false)
  assert.equal(obrigacaoPrecisaAcao({ estado: 'AGUARDANDO_TERCEIRO', proxima_revisao_em: '2026-10-13' }, agora), true)
  assert.equal(obrigacaoPrecisaAcao({ estado: 'AGUARDANDO_TERCEIRO', proxima_revisao_em: '2026-10-14' }, agora), false)
})

test('filtros separam acao, espera, minhas, sem responsavel e resolvidas', () => {
  const itens = [
    { id: 'a', estado: 'ABERTA', responsavel_usuario_empresa_id: admin.id },
    { id: 'b', estado: 'AGUARDANDO_TERCEIRO', proxima_revisao_em: '2099-01-01' },
    { id: 'c', estado: 'RESOLVIDA', responsavel_usuario_empresa_id: admin.id }
  ]
  const base = { obrigacoes: itens, meuVinculoId: admin.id, usuariosElegiveis: [admin] }
  assert.deepEqual(filtrarObrigacoesOperacionais({ ...base, filtro: 'minhas' }).map((x) => x.id), ['a'])
  assert.deepEqual(filtrarObrigacoesOperacionais({ ...base, filtro: 'espera' }).map((x) => x.id), ['b'])
  assert.deepEqual(filtrarObrigacoesOperacionais({ ...base, filtro: 'sem_responsavel' }).map((x) => x.id), ['b'])
  assert.deepEqual(filtrarObrigacoesOperacionais({ ...base, filtro: 'resolvidas' }).map((x) => x.id), ['c'])
})

test('resumo do dashboard conta somente obrigacoes ativas reais', () => {
  const resumo = resumirObrigacoesOperacionais({
    obrigacoes: [
      { estado: 'ABERTA', responsavel_usuario_empresa_id: admin.id },
      { estado: 'AGUARDANDO_TERCEIRO' },
      { estado: 'RESOLVIDA', responsavel_usuario_empresa_id: admin.id }
    ],
    meuVinculoId: admin.id,
    usuariosElegiveis: [admin]
  })
  assert.deepEqual(resumo, { minhas: 1, aguardando: 1, semResponsavel: 1 })
})
