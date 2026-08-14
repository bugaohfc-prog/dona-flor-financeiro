import test from 'node:test'
import assert from 'node:assert/strict'

import {
  admissaoFoiAlterada,
  impactoAdmissaoCorresponde,
  mensagemErroAdmissao,
  motivoAdmissaoValido,
  separarAdmissaoDoPayload
} from './admissaoFuncionarioRules.js'

test('detecta mudança de admissão por data civil', () => {
  assert.equal(admissaoFoiAlterada({ data_admissao: '2026-08-14' }, '2026-08-14'), false)
  assert.equal(admissaoFoiAlterada({ data_admissao: '2026-08-14' }, '2026-08-15'), true)
  assert.equal(admissaoFoiAlterada({ data_admissao: null }, ''), false)
})

test('traduz bloqueios determinísticos da autoridade de admissão', () => {
  assert.match(mensagemErroAdmissao({ message: 'ADMISSAO_29FEV_REQUER_DECISAO' }, 'fallback'), /29\/02/)
  assert.match(mensagemErroAdmissao({ message: 'ADMISSAO_POSTERIOR_A_CICLO_EXISTENTE' }, 'fallback'), /ciclo de férias/)
  assert.equal(mensagemErroAdmissao({ message: 'erro desconhecido' }, 'fallback'), 'fallback')
})

test('separa admissão do payload que segue pelo update genérico', () => {
  assert.deepEqual(separarAdmissaoDoPayload({
    nome: 'Teste',
    status: 'ativo',
    data_admissao: '2026-08-14'
  }), {
    dataAdmissao: '2026-08-14',
    demaisCampos: { nome: 'Teste', status: 'ativo' }
  })
})

test('exige motivo útil e invalida preflight de outra data', () => {
  assert.equal(motivoAdmissaoValido('erro'), false)
  assert.equal(motivoAdmissaoValido('Correção cadastral'), true)
  assert.equal(impactoAdmissaoCorresponde({ data_admissao_nova: '2026-08-14' }, '2026-08-14'), true)
  assert.equal(impactoAdmissaoCorresponde({ data_admissao_nova: '2026-08-14' }, '2026-08-15'), false)
})
