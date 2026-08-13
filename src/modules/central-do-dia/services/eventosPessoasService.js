import { listarCompetenciasFolhaAgenda } from '../../../services/folhaService.js'
import { listarExamesPeriodicosAgenda } from '../../../services/funcionariosExamesPeriodicosService.js'
import {
  listarTodosCiclosFerias,
  listarTodosPeriodosFerias
} from '../../../services/funcionariosFeriasService.js'
import { listarFuncionarios } from '../../../services/funcionariosService.js'
import { executarConsultasEventosPessoas } from './eventosPessoasBatch.js'
export { FONTES_EVENTOS_PESSOAS } from './eventosPessoasBatch.js'

const CONSULTAS_PADRAO = Object.freeze({
  funcionarios: ({ supabase, empresaId }) => listarFuncionarios({ supabase, empresaId }),
  ciclosFerias: ({ supabase, empresaId }) => listarTodosCiclosFerias({ supabase, empresaId }),
  periodosFerias: ({ supabase, empresaId }) => listarTodosPeriodosFerias({ supabase, empresaId }),
  exames: ({ supabase, empresaId }) => listarExamesPeriodicosAgenda({ supabase, empresaId }),
  folha: ({ supabase, empresaId }) => listarCompetenciasFolhaAgenda({ supabase, empresaId })
})

export async function consultarFontesEventosPessoas({
  supabase,
  empresaId,
  consultas = CONSULTAS_PADRAO
} = {}) {
  return executarConsultasEventosPessoas({
    consultas,
    parametros: { supabase, empresaId }
  })
}
