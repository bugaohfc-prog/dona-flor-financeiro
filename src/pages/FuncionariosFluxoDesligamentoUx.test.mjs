import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const pagina = fs.readFileSync('src/pages/FuncionariosPage.jsx', 'utf8')
const css = fs.readFileSync('src/pages/FuncionariosPage.css', 'utf8')

test('modal apresenta hierarquia funcional e estados amigáveis', () => {
  assert.match(pagina, /Desligamento de \{funcionarioDesligamento\.nome/)
  assert.match(pagina, /Dados do desligamento/)
  assert.match(pagina, /<strong>Acerto<\/strong>/)
  assert.match(pagina, /Conta do acerto/)
  assert.match(pagina, /Situação: Não iniciado/)
  assert.match(pagina, /Situação: Em andamento/)
  assert.match(pagina, /Situação: Vínculo encerrado/)
  assert.match(pagina, /Situação: Conclusão revertida/)
  assert.doesNotMatch(pagina, /Desligamento 2B/)
  assert.doesNotMatch(pagina, />Processo de desligamento</)
  assert.doesNotMatch(pagina, /value=\{desligamentoAbertoSelecionado\?\.estado \|\| 'NOVO'\}/)
})

test('campos e próximas ações explicam o efeito operacional', () => {
  assert.match(pagina, /Motivo \(obrigatório\)/)
  assert.match(pagina, /Último dia trabalhado \(obrigatório\)/)
  assert.match(pagina, /Observações \(opcional\)/)
  assert.match(pagina, /Iniciar não encerra o vínculo/)
  assert.match(pagina, /Iniciar desligamento/)
  assert.match(pagina, /Esta ação altera o status do vínculo para desligado/)
  assert.match(pagina, /O vínculo foi encerrado\. O próximo passo é registrar os dados do acerto/)
  assert.doesNotMatch(pagina, /Último dia pretendido/)
})

test('etapas futuras são apenas orientação visual responsiva', () => {
  assert.match(pagina, /funcionario-desligamento-etapas/)
  assert.match(pagina, /className="is-futura"/)
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*funcionario-desligamento-etapas ol/)
  assert.doesNotMatch(pagina, /onClick=.*Conta do acerto/)
})
