import { createClient } from '@supabase/supabase-js'

const TABLE = 'df_funcionarios'

const FAKE_FUNCIONARIO = {
  nome: 'TESTE RLS FUNCIONARIO',
  cpf: '12345678901',
  telefone: '11999999999',
  email: 'teste.rls@example.com',
  cargo: 'Teste RLS',
  status: 'ativo',
}

const STATUS = {
  ok: 'OK',
  fail: 'FALHOU',
  skip: 'PULADO',
}

const COLUMNS = [
  'Perfil',
  'Empresa propria',
  'Outra empresa',
  'SELECT propria',
  'SELECT outra',
  'INSERT',
  'UPDATE',
  'ARQUIVAR',
  'DELETE',
  'empresa_id imutavel',
  'filial cross-tenant',
]

const REQUIRED_ENV = [
  'TESTE_OPERADOR_EMAIL',
  'TESTE_OPERADOR_PASSWORD',
  'TESTE_GERENTE_EMAIL',
  'TESTE_GERENTE_PASSWORD',
  'TESTE_ADMIN_EMAIL',
  'TESTE_ADMIN_PASSWORD',
  'TESTE_MASTER_EMAIL',
  'TESTE_MASTER_PASSWORD',
  'TESTE_EMPRESA_DONA_ID',
  'TESTE_EMPRESA_CHOCO_ID',
]

const PROFILES = [
  {
    key: 'operador',
    label: 'Operador',
    emailEnv: 'TESTE_OPERADOR_EMAIL',
    passwordEnv: 'TESTE_OPERADOR_PASSWORD',
    companyEnv: 'TESTE_OPERADOR_EMPRESA_ID',
    otherCompanyEnv: 'TESTE_OPERADOR_OUTRA_EMPRESA_ID',
  },
  {
    key: 'gerente',
    label: 'Gerente',
    emailEnv: 'TESTE_GERENTE_EMAIL',
    passwordEnv: 'TESTE_GERENTE_PASSWORD',
    companyEnv: 'TESTE_GERENTE_EMPRESA_ID',
    otherCompanyEnv: 'TESTE_GERENTE_OUTRA_EMPRESA_ID',
  },
  {
    key: 'admin',
    label: 'Admin',
    emailEnv: 'TESTE_ADMIN_EMAIL',
    passwordEnv: 'TESTE_ADMIN_PASSWORD',
    companyEnv: 'TESTE_ADMIN_EMPRESA_ID',
    otherCompanyEnv: 'TESTE_ADMIN_OUTRA_EMPRESA_ID',
  },
  {
    key: 'master',
    label: 'Master',
    emailEnv: 'TESTE_MASTER_EMAIL',
    passwordEnv: 'TESTE_MASTER_PASSWORD',
    companyEnv: 'TESTE_MASTER_EMPRESA_ID',
    otherCompanyEnv: 'TESTE_MASTER_OUTRA_EMPRESA_ID',
  },
]

function getEnv(name) {
  return String(process.env[name] || '').trim()
}

function getFirstEnv(names) {
  for (const name of names) {
    const value = getEnv(name)
    if (value) return value
  }

  return ''
}

function companyLabel(config, empresaId) {
  if (!empresaId) return 'nao definida'
  if (empresaId === config.empresaDonaId) return 'Dona Flor'
  if (empresaId === config.empresaChocoId) return 'Choco Arte'
  return `Empresa ${empresaId.slice(0, 8)}`
}

function resolveOtherFilialId(config, empresaId) {
  if (empresaId === config.empresaDonaId) return config.filialDonaId
  if (empresaId === config.empresaChocoId) return config.filialChocoId
  return ''
}

function resolveProfileCompanies(profile, config) {
  const ownEnv = profile.companyEnv
  const otherEnv = profile.otherCompanyEnv
  const ownEmpresaId = getEnv(ownEnv) || config.empresaDonaId
  const otherEmpresaId = getEnv(otherEnv) || config.empresaChocoId

  if (!ownEmpresaId || !otherEmpresaId) {
    throw new Error(`${profile.label}: empresa propria/outra empresa nao configurada.`)
  }

  if (ownEmpresaId === otherEmpresaId) {
    throw new Error(
      `${profile.label}: configuracao invalida; empresa propria e outra empresa sao iguais.`,
    )
  }

  return {
    ownEmpresaId,
    otherEmpresaId,
    otherFilialId: resolveOtherFilialId(config, otherEmpresaId),
  }
}

function decodeJwtPayload(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

function validateAnonKey(key) {
  if (!key) {
    throw new Error('Supabase anon key nao informada.')
  }

  if (key.startsWith('sb_secret_')) {
    throw new Error('Chave secreta detectada. Use somente anon/publishable key.')
  }

  if (key.startsWith('sb_publishable_')) {
    return
  }

  const payload = decodeJwtPayload(key)

  if (!payload) {
    throw new Error('Nao foi possivel validar a chave como anon key.')
  }

  if (payload.role === 'service_role') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY/service_role detectada. RLS seria bypassada.')
  }

  if (payload.role !== 'anon') {
    throw new Error(`Chave Supabase com role inesperada: ${payload.role || 'indefinida'}.`)
  }
}

function validateConfig() {
  const serviceRoleEnvNames = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SERVICE_ROLE_KEY',
    'VITE_SUPABASE_SERVICE_ROLE_KEY',
  ]
  const filledServiceRole = serviceRoleEnvNames.filter((name) => getEnv(name))

  if (filledServiceRole.length > 0) {
    throw new Error(
      `Recusado: variavel de service role preenchida (${filledServiceRole.join(', ')}).`,
    )
  }

  const url = getFirstEnv(['VITE_SUPABASE_URL', 'SUPABASE_URL'])
  const anonKey = getFirstEnv(['VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'])

  if (!url) {
    throw new Error('Supabase URL nao informada.')
  }

  try {
    new URL(url)
  } catch {
    throw new Error('Supabase URL invalida.')
  }

  validateAnonKey(anonKey)

  const missing = REQUIRED_ENV.filter((name) => !getEnv(name))
  if (missing.length > 0) {
    throw new Error(`Variaveis de teste ausentes: ${missing.join(', ')}.`)
  }

  const config = {
    url,
    anonKey,
    empresaDonaId: getEnv('TESTE_EMPRESA_DONA_ID'),
    empresaChocoId: getEnv('TESTE_EMPRESA_CHOCO_ID'),
    filialDonaId: getEnv('TESTE_FILIAL_DONA_ID'),
    filialChocoId: getEnv('TESTE_FILIAL_CHOCO_ID'),
  }

  config.profileCompanies = Object.fromEntries(
    PROFILES.map((profile) => [profile.key, resolveProfileCompanies(profile, config)]),
  )

  return config
}

function createSupabaseClient(url, anonKey) {
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

async function loginProfile(config, profile) {
  const client = createSupabaseClient(config.url, config.anonKey)
  const { error } = await client.auth.signInWithPassword({
    email: getEnv(profile.emailEnv),
    password: getEnv(profile.passwordEnv),
  })

  if (error) {
    throw new Error(`${profile.label}: falha de login (${safeError(error)}).`)
  }

  return client
}

function sanitizeText(value) {
  return String(value || '')
    .replaceAll(FAKE_FUNCIONARIO.cpf, '[CPF_FAKE]')
    .replaceAll(FAKE_FUNCIONARIO.telefone, '[TELEFONE_FAKE]')
    .replaceAll(FAKE_FUNCIONARIO.email, '[EMAIL_FAKE]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[TOKEN]')
    .slice(0, 180)
}

function safeError(error) {
  if (!error) return 'sem erro'

  const code = sanitizeText(error.code || error.status || 'sem_codigo')
  const message = sanitizeText(error.message || error.details || 'erro sem mensagem')

  return `${code}: ${message}`
}

function newResult(profileLabel, config, profileCompanies) {
  return {
    Perfil: profileLabel,
    'Empresa propria': companyLabel(config, profileCompanies.ownEmpresaId),
    'Outra empresa': companyLabel(config, profileCompanies.otherEmpresaId),
    'SELECT propria': STATUS.skip,
    'SELECT outra': STATUS.skip,
    INSERT: STATUS.skip,
    UPDATE: STATUS.skip,
    ARQUIVAR: STATUS.skip,
    DELETE: STATUS.skip,
    'empresa_id imutavel': STATUS.skip,
    'filial cross-tenant': STATUS.skip,
  }
}

function mark(result, column, passed, failures, detail) {
  result[column] = passed ? STATUS.ok : STATUS.fail
  if (!passed) failures.push(detail)
}

function markSkip(result, column) {
  result[column] = STATUS.skip
}

function hasRows(response) {
  return Array.isArray(response.data) && response.data.length > 0
}

function isBlocked(response) {
  return Boolean(response.error) || !hasRows(response)
}

async function insertFuncionario(client, empresaId, extra = {}) {
  return client
    .from(TABLE)
    .insert({
      ...FAKE_FUNCIONARIO,
      ...extra,
      empresa_id: empresaId,
      arquivado: false,
    })
    .select('id, empresa_id, arquivado')
    .single()
}

async function selectFuncionario(client, empresaId) {
  return client
    .from(TABLE)
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('nome', FAKE_FUNCIONARIO.nome)
    .limit(5)
}

async function updateCargo(client, id) {
  return client
    .from(TABLE)
    .update({ cargo: FAKE_FUNCIONARIO.cargo })
    .eq('id', id)
    .select('id')
}

async function archiveFuncionario(client, id) {
  return client
    .from(TABLE)
    .update({ arquivado: true })
    .eq('id', id)
    .select('id')
}

async function deleteFuncionario(client, id) {
  return client.from(TABLE).delete().eq('id', id).select('id')
}

async function updateEmpresaId(client, id, empresaId) {
  return client.from(TABLE).update({ empresa_id: empresaId }).eq('id', id).select('id')
}

async function updateFilialId(client, id, filialId) {
  return client.from(TABLE).update({ filial_id: filialId }).eq('id', id).select('id')
}

function requireFixture(fixture, result, columns) {
  if (fixture?.id) return true
  for (const column of columns) markSkip(result, column)
  return false
}

async function testBlockedProfile({
  client,
  label,
  config,
  profileCompanies,
  empresaOwnId,
  empresaOtherId,
  fixtureOwn,
  fixtureOther,
  filialOtherId,
  failures,
  createdRows,
}) {
  const result = newResult(label, config, profileCompanies)

  if (fixtureOwn?.id) {
    const selectOwn = await selectFuncionario(client, empresaOwnId)
    mark(
      result,
      'SELECT propria',
      isBlocked(selectOwn),
      failures,
      `${label} conseguiu ler funcionarios da propria empresa`,
    )
  }

  if (fixtureOther?.id) {
    const selectOther = await selectFuncionario(client, empresaOtherId)
    mark(
      result,
      'SELECT outra',
      isBlocked(selectOther),
      failures,
      `${label} conseguiu ler funcionarios de outra empresa`,
    )
  }

  const insertOwn = await insertFuncionario(client, empresaOwnId)
  const insertBlocked = Boolean(insertOwn.error) || !insertOwn.data?.id
  mark(
    result,
    'INSERT',
    insertBlocked,
    failures,
    `${label} conseguiu criar funcionario em ${companyLabel(config, empresaOwnId)}`,
  )
  if (!insertBlocked && insertOwn.data?.id) {
    createdRows.push({ id: insertOwn.data.id, empresaId: empresaOwnId, cleanup: 'master' })
  }

  if (!requireFixture(fixtureOwn, result, ['UPDATE', 'ARQUIVAR', 'DELETE', 'empresa_id imutavel'])) {
    return result
  }

  const updateOwn = await updateCargo(client, fixtureOwn.id)
  mark(result, 'UPDATE', isBlocked(updateOwn), failures, `${label} conseguiu editar funcionario`)

  const archiveOwn = await archiveFuncionario(client, fixtureOwn.id)
  mark(result, 'ARQUIVAR', isBlocked(archiveOwn), failures, `${label} conseguiu arquivar funcionario`)

  const deleteOwn = await deleteFuncionario(client, fixtureOwn.id)
  mark(result, 'DELETE', isBlocked(deleteOwn), failures, `${label} conseguiu excluir funcionario`)

  const moveCompany = await updateEmpresaId(client, fixtureOwn.id, empresaOtherId)
  mark(
    result,
    'empresa_id imutavel',
    isBlocked(moveCompany),
    failures,
    `${label} conseguiu alterar empresa_id`,
  )

  if (filialOtherId) {
    const crossFilial = await updateFilialId(client, fixtureOwn.id, filialOtherId)
    mark(
      result,
      'filial cross-tenant',
      isBlocked(crossFilial),
      failures,
      `${label} conseguiu usar filial de outra empresa`,
    )
  }

  return result
}

async function testManagerProfile(args) {
  const {
    client,
    label,
    config,
    profileCompanies,
    empresaOwnId,
    empresaOtherId,
    fixtureOwn,
    fixtureOther,
    filialOtherId,
    failures,
    createdRows,
  } = args
  const result = newResult(label, config, profileCompanies)

  if (fixtureOwn?.id) {
    const selectOwn = await selectFuncionario(client, empresaOwnId)
    mark(
      result,
      'SELECT propria',
      !selectOwn.error && hasRows(selectOwn),
      failures,
      `${label} nao conseguiu ler funcionarios da propria empresa`,
    )
  }

  if (fixtureOther?.id) {
    const selectOther = await selectFuncionario(client, empresaOtherId)
    mark(
      result,
      'SELECT outra',
      isBlocked(selectOther),
      failures,
      `${label} conseguiu ler funcionarios de outra empresa`,
    )
  }

  const insertOwn = await insertFuncionario(client, empresaOwnId)
  const insertBlocked = Boolean(insertOwn.error) || !insertOwn.data?.id
  mark(
    result,
    'INSERT',
    insertBlocked,
    failures,
    `${label} conseguiu criar funcionario em ${companyLabel(config, empresaOwnId)}`,
  )
  if (!insertBlocked) {
    createdRows.push({ id: insertOwn.data.id, empresaId: empresaOwnId, cleanup: 'master' })
  }

  if (!requireFixture(fixtureOwn, result, ['UPDATE', 'ARQUIVAR', 'DELETE', 'empresa_id imutavel'])) {
    return result
  }

  const updateOwn = await updateCargo(client, fixtureOwn.id)
  mark(result, 'UPDATE', isBlocked(updateOwn), failures, `${label} conseguiu editar funcionario`)

  const archiveOwn = await archiveFuncionario(client, fixtureOwn.id)
  mark(result, 'ARQUIVAR', isBlocked(archiveOwn), failures, `${label} conseguiu arquivar funcionario`)

  const deleteOwn = await deleteFuncionario(client, fixtureOwn.id)
  mark(result, 'DELETE', isBlocked(deleteOwn), failures, `${label} conseguiu excluir funcionario`)

  const moveCompany = await updateEmpresaId(client, fixtureOwn.id, empresaOtherId)
  mark(
    result,
    'empresa_id imutavel',
    isBlocked(moveCompany),
    failures,
    `${label} conseguiu alterar empresa_id`,
  )

  if (filialOtherId) {
    const crossFilial = await updateFilialId(client, fixtureOwn.id, filialOtherId)
    mark(
      result,
      'filial cross-tenant',
      isBlocked(crossFilial),
      failures,
      `${label} conseguiu usar filial de outra empresa`,
    )
  }

  return result
}

async function testAdminLikeProfile({
  client,
  label,
  config,
  profileCompanies,
  empresaOwnId,
  empresaOtherId,
  fixtureOwn,
  fixtureOther,
  filialOtherId,
  failures,
  createdRows,
  cleanup,
  expectOtherBlocked,
}) {
  const result = newResult(label, config, profileCompanies)

  const insertOwn = fixtureOwn?.id ? { data: fixtureOwn, error: null } : await insertFuncionario(client, empresaOwnId)
  mark(
    result,
    'INSERT',
    !insertOwn.error && Boolean(insertOwn.data?.id),
    failures,
    `${label} nao conseguiu criar funcionario em ${companyLabel(config, empresaOwnId)}; confira vinculo/perfil`,
  )

  const own = insertOwn.data
  if (own?.id && !fixtureOwn?.id) createdRows.push({ id: own.id, empresaId: empresaOwnId, cleanup })

  if (!own?.id) {
    markSkip(result, 'SELECT propria')
    markSkip(result, 'UPDATE')
    markSkip(result, 'ARQUIVAR')
    markSkip(result, 'DELETE')
    markSkip(result, 'empresa_id imutavel')
    markSkip(result, 'filial cross-tenant')
    return result
  }

  const selectOwn = await selectFuncionario(client, empresaOwnId)
  mark(
    result,
    'SELECT propria',
    !selectOwn.error && hasRows(selectOwn),
    failures,
    `${label} nao conseguiu ler funcionarios da propria empresa`,
  )

  if (fixtureOther?.id) {
    const selectOther = await selectFuncionario(client, empresaOtherId)
    const ok = expectOtherBlocked ? isBlocked(selectOther) : !selectOther.error
    mark(
      result,
      'SELECT outra',
      ok,
      failures,
      expectOtherBlocked
        ? `${label} conseguiu ler funcionarios de outra empresa`
        : `${label} nao conseguiu consultar outra empresa conforme regra master`,
    )
  }

  const updateOwn = await updateCargo(client, own.id)
  mark(
    result,
    'UPDATE',
    !updateOwn.error && hasRows(updateOwn),
    failures,
    `${label} nao conseguiu editar funcionario`,
  )

  const archiveOwn = await archiveFuncionario(client, own.id)
  mark(
    result,
    'ARQUIVAR',
    !archiveOwn.error && hasRows(archiveOwn),
    failures,
    `${label} nao conseguiu arquivar funcionario`,
  )

  const deleteOwn = await deleteFuncionario(client, own.id)
  mark(
    result,
    'DELETE',
    isBlocked(deleteOwn),
    failures,
    `${label} conseguiu excluir funcionario fisicamente`,
  )

  const moveCompany = await updateEmpresaId(client, own.id, empresaOtherId)
  mark(
    result,
    'empresa_id imutavel',
    isBlocked(moveCompany),
    failures,
    `${label} conseguiu alterar empresa_id`,
  )

  if (filialOtherId) {
    const crossFilial = await updateFilialId(client, own.id, filialOtherId)
    mark(
      result,
      'filial cross-tenant',
      isBlocked(crossFilial),
      failures,
      `${label} conseguiu usar filial de outra empresa`,
    )
  }

  return result
}

async function cleanupRows(rows, clients) {
  const failures = []
  const uniqueRows = Array.from(new Map(rows.filter((row) => row.id).map((row) => [row.id, row])).values())

  for (const row of uniqueRows) {
    const client = row.cleanup === 'master' ? clients.master : clients.admin
    if (!client) {
      failures.push('sem cliente autorizado para arquivar dados fake')
      continue
    }

    const result = await archiveFuncionario(client, row.id)
    if (result.error || !hasRows(result)) {
      failures.push(`arquivamento pendente (${safeError(result.error)})`)
    }
  }

  return failures
}

function renderSummary(rows) {
  const widths = COLUMNS.map((column) => Math.max(column.length, ...rows.map((row) => row[column].length)))
  const line = widths.map((width) => '-'.repeat(width)).join('-|-')
  const header = COLUMNS.map((column, index) => column.padEnd(widths[index])).join(' | ')

  console.log(header)
  console.log(line)
  for (const row of rows) {
    console.log(COLUMNS.map((column, index) => row[column].padEnd(widths[index])).join(' | '))
  }
}

function renderFailures(failures) {
  if (failures.length === 0) return

  console.log('')
  console.log('Falhas resumidas:')
  for (const failure of failures) {
    console.log(`- ${sanitizeText(failure)}`)
  }
}

function renderCompanyPlan(config) {
  console.log('')
  console.log('Empresas usadas por perfil:')
  for (const profile of PROFILES) {
    const profileCompanies = config.profileCompanies[profile.key]
    console.log(
      `- ${profile.label}: propria=${companyLabel(
        config,
        profileCompanies.ownEmpresaId,
      )}; outra=${companyLabel(config, profileCompanies.otherEmpresaId)}`,
    )
  }
}

async function main() {
  const config = validateConfig()
  const clients = {}
  const failures = []
  const createdRows = []
  const rows = []
  const fixturesByCompany = new Map()

  console.log('Validacao RLS df_funcionarios')
  console.log('Usando anon/publishable key. Tokens nao serao impressos.')
  renderCompanyPlan(config)

  for (const profile of PROFILES) {
    clients[profile.key] = await loginProfile(config, profile)
  }

  async function createFixture({ client, empresaId, cleanup, failurePrefix }) {
    const response = await insertFuncionario(client, empresaId)
    if (response.error || !response.data?.id) {
      failures.push(
        `${failurePrefix} em ${companyLabel(config, empresaId)} (${safeError(
          response.error,
        )}); confira vinculo/perfil`,
      )
      return null
    }

    const fixture = response.data
    createdRows.push({ id: fixture.id, empresaId, cleanup })
    if (!fixturesByCompany.has(empresaId)) fixturesByCompany.set(empresaId, fixture)
    return fixture
  }

  const adminCompanies = config.profileCompanies.admin
  const masterCompanies = config.profileCompanies.master
  const operadorCompanies = config.profileCompanies.operador
  const gerenteCompanies = config.profileCompanies.gerente

  const adminFixture = await createFixture({
    client: clients.admin,
    empresaId: adminCompanies.ownEmpresaId,
    cleanup: 'admin',
    failurePrefix: 'Admin nao criou fixture inicial',
  })

  const masterFixture = await createFixture({
    client: clients.master,
    empresaId: masterCompanies.ownEmpresaId,
    cleanup: 'master',
    failurePrefix: 'Master nao criou fixture principal',
  })

  const neededCompanyIds = new Set(
    Object.values(config.profileCompanies).flatMap((profileCompanies) => [
      profileCompanies.ownEmpresaId,
      profileCompanies.otherEmpresaId,
    ]),
  )

  for (const empresaId of neededCompanyIds) {
    if (fixturesByCompany.has(empresaId)) continue

    await createFixture({
      client: clients.master,
      empresaId,
      cleanup: 'master',
      failurePrefix: 'Master nao criou fixture de apoio',
    })
  }

  rows.push(
    await testBlockedProfile({
      client: clients.operador,
      label: 'Operador',
      config,
      profileCompanies: operadorCompanies,
      empresaOwnId: operadorCompanies.ownEmpresaId,
      empresaOtherId: operadorCompanies.otherEmpresaId,
      fixtureOwn: fixturesByCompany.get(operadorCompanies.ownEmpresaId),
      fixtureOther: fixturesByCompany.get(operadorCompanies.otherEmpresaId),
      filialOtherId: operadorCompanies.otherFilialId,
      failures,
      createdRows,
    }),
  )

  rows.push(
    await testManagerProfile({
      client: clients.gerente,
      label: 'Gerente',
      config,
      profileCompanies: gerenteCompanies,
      empresaOwnId: gerenteCompanies.ownEmpresaId,
      empresaOtherId: gerenteCompanies.otherEmpresaId,
      fixtureOwn: fixturesByCompany.get(gerenteCompanies.ownEmpresaId),
      fixtureOther: fixturesByCompany.get(gerenteCompanies.otherEmpresaId),
      filialOtherId: gerenteCompanies.otherFilialId,
      failures,
      createdRows,
    }),
  )

  rows.push(
    await testAdminLikeProfile({
      client: clients.admin,
      label: 'Admin',
      config,
      profileCompanies: adminCompanies,
      empresaOwnId: adminCompanies.ownEmpresaId,
      empresaOtherId: adminCompanies.otherEmpresaId,
      fixtureOwn: adminFixture,
      fixtureOther: fixturesByCompany.get(adminCompanies.otherEmpresaId),
      filialOtherId: adminCompanies.otherFilialId,
      failures,
      createdRows,
      cleanup: 'admin',
      expectOtherBlocked: true,
    }),
  )

  rows.push(
    await testAdminLikeProfile({
      client: clients.master,
      label: 'Master',
      config,
      profileCompanies: masterCompanies,
      empresaOwnId: masterCompanies.ownEmpresaId,
      empresaOtherId: masterCompanies.otherEmpresaId,
      fixtureOwn: masterFixture,
      fixtureOther: fixturesByCompany.get(masterCompanies.otherEmpresaId),
      filialOtherId: masterCompanies.otherFilialId,
      failures,
      createdRows,
      cleanup: 'master',
      expectOtherBlocked: false,
    }),
  )

  const cleanupFailures = await cleanupRows(createdRows, clients)
  if (cleanupFailures.length > 0) {
    failures.push(...cleanupFailures.map((failure) => `Limpeza segura pendente: ${failure}`))
  }

  console.log('')
  renderSummary(rows)
  renderFailures(failures)

  console.log('')
  console.log(`Status final: ${failures.length === 0 ? 'APROVADO' : 'FALHOU'}`)

  if (cleanupFailures.length > 0) {
    console.log('Limpeza manual segura: arquivar registros fake restantes com usuario admin/master.')
  }

  process.exitCode = failures.length === 0 ? 0 : 1
}

main().catch((error) => {
  console.error(`FALHOU: ${sanitizeText(error.message)}`)
  process.exitCode = 2
})
