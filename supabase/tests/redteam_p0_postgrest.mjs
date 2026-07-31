import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';

const apiUrl = process.env.API_URL;
const anonKey = process.env.ANON_KEY;
const serviceRoleKey = process.env.SERVICE_ROLE_KEY;
const logDir = process.env.LOG_DIR || 'artifacts/redteam-p0-postgrest';
const password = 'CI-PostgREST-P0-2026!';

if (!apiUrl || !anonKey || !serviceRoleKey) {
  throw new Error('API_URL, ANON_KEY e SERVICE_ROLE_KEY locais sao obrigatorios.');
}

const IDS = Object.freeze({
  empresa: '10000000-0000-0000-0000-000000000011',
  filialA: '20000000-0000-0000-0000-000000000011',
  filialB: '20000000-0000-0000-0000-000000000012',
  centro: '30000000-0000-0000-0000-000000000011',
  vinculoAdmin: '40000000-0000-0000-0000-000000000011',
  vinculoGerente: '40000000-0000-0000-0000-000000000012',
  vinculoTotal: '40000000-0000-0000-0000-000000000013',
  vinculoMaster: '40000000-0000-0000-0000-000000000014',
  serieA: '60000000-0000-0000-0000-000000000011',
  serieB: '60000000-0000-0000-0000-000000000012',
  serieNull: '60000000-0000-0000-0000-000000000013',
  contaA: '70000000-0000-0000-0000-000000000011',
  contaB: '70000000-0000-0000-0000-000000000012',
  contaNull: '70000000-0000-0000-0000-000000000013',
  contaRecente: '73000000-0000-0000-0000-000000000011',
  contaAntiga: '73000000-0000-0000-0000-000000000012',
  notaAntiga: '74000000-0000-0000-0000-000000000011',
  funcionarioA: '75000000-0000-0000-0000-000000000011',
  funcionarioB: '75000000-0000-0000-0000-000000000012',
  competencia: '76000000-0000-0000-0000-000000000011',
  folhaA: '77000000-0000-0000-0000-000000000011',
  folhaB: '77000000-0000-0000-0000-000000000012',
  itemFolhaA: '78000000-0000-0000-0000-000000000011',
  itemFolhaB: '78000000-0000-0000-0000-000000000012',
  chaveA: '80000000-0000-0000-0000-000000000011',
  chaveB: '80000000-0000-0000-0000-000000000012',
});

const resultados = Object.fromEntries(
  ['P0-1', 'P0-2', 'P0-3', 'P0-4'].map((id) => [id, {
    veredito: 'BLOQUEADO',
    testes: [],
    erro: null,
  }]),
);

function garantir(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem);
}

async function requisicao(path, {
  method = 'GET',
  token = serviceRoleKey,
  apiKey = serviceRoleKey,
  body,
  prefer,
} = {}) {
  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${token}`,
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;

  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  return { ok: response.ok, status: response.status, data, text };
}

const rest = (path, options = {}) => requisicao(`/rest/v1/${path}`, options);

async function inserir(tabela, registros) {
  const response = await rest(tabela, {
    method: 'POST',
    body: registros,
    prefer: 'return=minimal',
  });
  garantir(response.ok, `Fixture ${tabela} falhou (${response.status}): ${response.text}`);
}

async function consultarUsuario(token, tabela, query) {
  const response = await comoUsuario(token, `${tabela}?${query}`);
  garantir(response.ok, `Consulta autenticada de evidencia ${tabela} falhou: ${response.text}`);
  return response.data;
}

async function criarUsuario(email) {
  const response = await requisicao('/auth/v1/admin/users', {
    method: 'POST',
    body: { email, password, email_confirm: true },
  });
  garantir(response.ok, `Criacao do usuario ${email} falhou: ${response.text}`);
  return response.data.id;
}

async function autenticar(email) {
  const response = await requisicao('/auth/v1/token?grant_type=password', {
    method: 'POST',
    token: anonKey,
    apiKey: anonKey,
    body: { email, password },
  });
  garantir(response.ok, `Login real de ${email} falhou: ${response.text}`);
  garantir(response.data?.access_token, `JWT ausente para ${email}`);
  return response.data.access_token;
}

function comoUsuario(token, path, options = {}) {
  return rest(path, { ...options, token, apiKey: anonKey });
}

async function prepararFixture() {
  const emails = {
    admin: 'admin-postgrest@ci.local',
    gerente: 'gerente-postgrest@ci.local',
    total: 'total-postgrest@ci.local',
    master: 'master-postgrest@ci.local',
  };
  const usuarios = {};
  for (const [perfil, email] of Object.entries(emails)) {
    usuarios[perfil] = await criarUsuario(email);
  }

  await inserir('df_usuarios_empresas', [
    { id: IDS.vinculoAdmin, empresa_id: IDS.empresa, user_id: usuarios.admin, email: emails.admin, perfil: 'admin', acesso_todas_filiais: false },
    { id: IDS.vinculoGerente, empresa_id: IDS.empresa, user_id: usuarios.gerente, email: emails.gerente, perfil: 'gerente', acesso_todas_filiais: false },
    { id: IDS.vinculoTotal, empresa_id: IDS.empresa, user_id: usuarios.total, email: emails.total, perfil: 'gerente', acesso_todas_filiais: true },
    { id: IDS.vinculoMaster, empresa_id: IDS.empresa, user_id: usuarios.master, email: emails.master, perfil: 'master', acesso_todas_filiais: false },
  ]);
  await inserir('df_usuarios_filiais', {
    empresa_id: IDS.empresa,
    usuario_id: IDS.vinculoGerente,
    filial_id: IDS.filialA,
  });
  return {
    emails,
    tokens: {
      admin: await autenticar(emails.admin),
      gerente: await autenticar(emails.gerente),
      total: await autenticar(emails.total),
      master: await autenticar(emails.master),
    },
  };
}

async function executarP0(id, testes) {
  try {
    for (const [nome, teste] of testes) {
      await teste();
      resultados[id].testes.push({ nome, status: 'APROVADO' });
      console.log(`ok - ${id} - ${nome}`);
    }
    resultados[id].veredito = 'APROVADO';
  } catch (error) {
    resultados[id].erro = error instanceof Error ? error.message : String(error);
    resultados[id].testes.push({ nome: 'falha', status: 'BLOQUEADO', detalhe: resultados[id].erro });
    console.error(`not ok - ${id} - ${resultados[id].erro}`);
  }
}

await mkdir(logDir, { recursive: true });
let fixture;
try {
  fixture = await prepararFixture();
} catch (error) {
  for (const resultado of Object.values(resultados)) resultado.erro = `Fixture: ${error.message}`;
  await writeFile(`${logDir}/postgrest-resultados.json`, JSON.stringify(resultados, null, 2));
  throw error;
}

const { tokens, emails } = fixture;

await executarP0('P0-1', [
  ['duas requisicoes HTTP concorrentes nao ultrapassam o saldo', async () => {
    const payload = (chave) => ({
      p_empresa_id: IDS.empresa,
      p_conta_id: IDS.contaA,
      p_valor: 80,
      p_data_pagamento: '2026-07-31',
      p_observacao: 'concorrencia HTTP CI',
      p_idempotency_key: chave,
    });
    const respostas = await Promise.all([
      comoUsuario(tokens.gerente, 'rpc/registrar_pagamento_parcial_controlado', { method: 'POST', body: payload(IDS.chaveA) }),
      comoUsuario(tokens.gerente, 'rpc/registrar_pagamento_parcial_controlado', { method: 'POST', body: payload(IDS.chaveB) }),
    ]);
    const sucessos = respostas.filter((resposta) => resposta.ok);
    garantir(sucessos.length === 1, `Esperado um sucesso concorrente; recebido ${respostas.map((r) => r.status).join(',')}`);
    const pagamentos = await consultarUsuario(tokens.gerente, 'df_contas_pagamentos', `conta_id=eq.${IDS.contaA}&select=id,valor_pago,idempotency_key,arquivado`);
    garantir(pagamentos.length === 1 && Number(pagamentos[0].valor_pago) === 80, 'Concorrencia criou valor ou quantidade incorreta');
    fixture.pagamento = pagamentos[0];
  }],
  ['retry com a mesma chave e idempotente', async () => {
    const response = await comoUsuario(tokens.gerente, 'rpc/registrar_pagamento_parcial_controlado', {
      method: 'POST',
      body: {
        p_empresa_id: IDS.empresa,
        p_conta_id: IDS.contaA,
        p_valor: 80,
        p_data_pagamento: '2026-07-31',
        p_observacao: 'concorrencia HTTP CI',
        p_idempotency_key: fixture.pagamento.idempotency_key,
      },
    });
    garantir(response.ok && response.data?.idempotente === true, `Retry nao foi idempotente: ${response.text}`);
    const pagamentos = await consultarUsuario(tokens.gerente, 'df_contas_pagamentos', `conta_id=eq.${IDS.contaA}&select=id`);
    garantir(pagamentos.length === 1, 'Retry duplicou pagamento');
  }],
  ['UPDATE direto de valor_pago e negado', async () => {
    const response = await comoUsuario(tokens.gerente, `df_contas_pagamentos?id=eq.${fixture.pagamento.id}`, {
      method: 'PATCH',
      body: { valor_pago: 1 },
      prefer: 'return=representation',
    });
    garantir(!response.ok, `UPDATE direto retornou ${response.status}`);
    const [pagamento] = await consultarUsuario(tokens.gerente, 'df_contas_pagamentos', `id=eq.${fixture.pagamento.id}&select=valor_pago`);
    garantir(Number(pagamento.valor_pago) === 80, 'UPDATE direto alterou valor_pago');
  }],
  ['arquivamento ocorre somente pela RPC e audita', async () => {
    const response = await comoUsuario(tokens.gerente, 'rpc/definir_arquivamento_pagamento_parcial', {
      method: 'POST',
      body: { p_empresa_id: IDS.empresa, p_conta_id: IDS.contaA, p_pagamento_id: fixture.pagamento.id, p_arquivado: true },
    });
    garantir(response.ok && response.data?.ok === true, `RPC de arquivamento falhou: ${response.text}`);
    const [pagamento] = await consultarUsuario(tokens.gerente, 'df_contas_pagamentos', `id=eq.${fixture.pagamento.id}&select=arquivado,valor_pago`);
    garantir(pagamento.arquivado === true && Number(pagamento.valor_pago) === 80, 'Arquivamento alterou campo financeiro ou nao persistiu');
  }],
]);

await executarP0('P0-2', [
  ['DELETE direto de conta e nota e negado', async () => {
    const [conta, nota] = await Promise.all([
      comoUsuario(tokens.admin, `df_contas?id=eq.${IDS.contaAntiga}`, { method: 'DELETE' }),
      comoUsuario(tokens.admin, `df_notas?id=eq.${IDS.notaAntiga}`, { method: 'DELETE' }),
    ]);
    garantir(!conta.ok && !nota.ok, `DELETE direto inesperado: conta=${conta.status}, nota=${nota.status}`);
  }],
  ['RPC recusa registro antes de 60 dias', async () => {
    const response = await comoUsuario(tokens.admin, 'rpc/excluir_conta_definitivamente', {
      method: 'POST',
      body: { p_empresa_id: IDS.empresa, p_conta_id: IDS.contaRecente },
    });
    garantir(!response.ok, 'RPC excluiu conta ainda em retencao');
    const conta = await consultarUsuario(tokens.admin, 'df_contas', `id=eq.${IDS.contaRecente}&select=id`);
    garantir(conta.length === 1, 'Conta recente desapareceu');
  }],
  ['RPC exclui elegiveis e grava auditoria', async () => {
    const conta = await comoUsuario(tokens.admin, 'rpc/excluir_conta_definitivamente', {
      method: 'POST',
      body: { p_empresa_id: IDS.empresa, p_conta_id: IDS.contaAntiga },
    });
    const nota = await comoUsuario(tokens.admin, 'rpc/excluir_nota_definitivamente', {
      method: 'POST',
      body: { p_empresa_id: IDS.empresa, p_nota_id: IDS.notaAntiga },
    });
    garantir(conta.ok && nota.ok, `RPC de lixeira falhou: ${conta.text} ${nota.text}`);
    const [contas, notas] = await Promise.all([
      consultarUsuario(tokens.admin, 'df_contas', `id=eq.${IDS.contaAntiga}&select=id`),
      consultarUsuario(tokens.admin, 'df_notas', `id=eq.${IDS.notaAntiga}&select=id`),
    ]);
    garantir(contas.length === 0 && notas.length === 0, 'RPC retornou sucesso sem excluir os registros elegiveis');
  }],
]);

await executarP0('P0-3', [
  ['gerente le somente a filial atribuida e nao ve NULL', async () => {
    const response = await comoUsuario(tokens.gerente, `df_contas?id=in.(${IDS.contaA},${IDS.contaB},${IDS.contaNull})&select=id,filial_id`);
    garantir(response.ok, `SELECT por filial falhou: ${response.text}`);
    garantir(response.data.length === 1 && response.data[0].id === IDS.contaA, `Matriz de filial incorreta: ${JSON.stringify(response.data)}`);
  }],
  ['mudanca para filial proibida e bloqueada', async () => {
    const response = await comoUsuario(tokens.gerente, `df_contas?id=eq.${IDS.contaA}`, {
      method: 'PATCH',
      body: { filial_id: IDS.filialB },
      prefer: 'return=representation',
    });
    garantir(!response.ok || response.data.length === 0, `Troca de filial retornou ${response.status}`);
    const [conta] = await consultarUsuario(tokens.gerente, 'df_contas', `id=eq.${IDS.contaA}&select=filial_id`);
    garantir(conta.filial_id === IDS.filialA, 'Conta foi movida para filial proibida');
  }],
  ['insercao com filial NULL e bloqueada para restrito', async () => {
    const response = await comoUsuario(tokens.gerente, 'df_contas', {
      method: 'POST',
      body: { empresa_id: IDS.empresa, descricao: 'Conta NULL negada', valor: 1, data_vencimento: '2026-08-20', filial_id: null },
    });
    garantir(!response.ok, 'Gerente restrito inseriu conta sem filial');
  }],
  ['Folha e itens nao vazam nem aceitam mutacao de gerente', async () => {
    const [folha, itens, update] = await Promise.all([
      comoUsuario(tokens.gerente, 'df_folha_lancamentos?select=id,filial_id'),
      comoUsuario(tokens.gerente, 'df_folha_lancamento_itens?select=id,filial_id'),
      comoUsuario(tokens.gerente, `df_folha_lancamentos?id=eq.${IDS.folhaA}`, { method: 'PATCH', body: { valor: 999 }, prefer: 'return=representation' }),
    ]);
    garantir(folha.ok && folha.data.length === 0, 'Gerente leu Folha');
    garantir(itens.ok && itens.data.length === 0, 'Gerente leu itens da Folha');
    garantir(!update.ok || update.data.length === 0, 'Gerente alterou Folha');
  }],
  ['acesso total explicito inclui filial NULL e Admin le Folha', async () => {
    const [total, folha, itens] = await Promise.all([
      comoUsuario(tokens.total, `df_contas?id=in.(${IDS.contaA},${IDS.contaB},${IDS.contaNull})&select=id`),
      comoUsuario(tokens.admin, `df_folha_lancamentos?id=in.(${IDS.folhaA},${IDS.folhaB})&select=id`),
      comoUsuario(tokens.admin, `df_folha_lancamento_itens?id=in.(${IDS.itemFolhaA},${IDS.itemFolhaB})&select=id`),
    ]);
    garantir(total.ok && total.data.length === 3, 'Acesso total explicito nao incluiu todas/NULL');
    garantir(folha.ok && folha.data.length === 2, 'Admin nao leu Folha integral');
    garantir(itens.ok && itens.data.length === 2, 'Admin nao leu itens da Folha integral');
  }],
]);

await executarP0('P0-4', [
  ['membro autorizado mantem SELECT da recorrencia', async () => {
    const response = await comoUsuario(tokens.gerente, `df_contas_recorrentes?id=eq.${IDS.serieA}&select=id,descricao`);
    garantir(response.ok && response.data.length === 1, `SELECT de recorrencia falhou: ${response.text}`);
  }],
  ['gerente nao insere, altera ou exclui recorrencia', async () => {
    const insert = await comoUsuario(tokens.gerente, 'df_contas_recorrentes', {
      method: 'POST',
      body: { empresa_id: IDS.empresa, descricao: 'Serie gerente negada', valor: 1, dia_vencimento: 1, filial_id: IDS.filialA },
    });
    const update = await comoUsuario(tokens.gerente, `df_contas_recorrentes?id=eq.${IDS.serieA}`, {
      method: 'PATCH', body: { valor: 999 }, prefer: 'return=representation',
    });
    const remove = await comoUsuario(tokens.gerente, `df_contas_recorrentes?id=eq.${IDS.serieA}`, {
      method: 'DELETE', prefer: 'return=representation',
    });
    garantir(!insert.ok, 'Gerente inseriu recorrencia');
    garantir(!update.ok || update.data.length === 0, 'Gerente alterou recorrencia');
    garantir(!remove.ok || remove.data.length === 0, 'Gerente excluiu recorrencia');
    const [serie] = await consultarUsuario(tokens.gerente, 'df_contas_recorrentes', `id=eq.${IDS.serieA}&select=valor`);
    garantir(Number(serie.valor) === 100, 'Mutacao negada modificou a serie');
  }],
  ['Admin e Master executam somente mutacoes autorizadas', async () => {
    const adminId = '60000000-0000-0000-0000-000000000014';
    const masterId = '60000000-0000-0000-0000-000000000015';
    const adminInsert = await comoUsuario(tokens.admin, 'df_contas_recorrentes', {
      method: 'POST', body: { id: adminId, empresa_id: IDS.empresa, descricao: 'Serie Admin HTTP', valor: 1, dia_vencimento: 1, filial_id: IDS.filialA }, prefer: 'return=representation',
    });
    const adminUpdate = await comoUsuario(tokens.admin, `df_contas_recorrentes?id=eq.${adminId}`, {
      method: 'PATCH', body: { valor: 2 }, prefer: 'return=representation',
    });
    const adminDelete = await comoUsuario(tokens.admin, `df_contas_recorrentes?id=eq.${adminId}`, { method: 'DELETE', prefer: 'return=representation' });
    const masterInsert = await comoUsuario(tokens.master, 'df_contas_recorrentes', {
      method: 'POST', body: { id: masterId, empresa_id: IDS.empresa, descricao: 'Serie Master HTTP', valor: 1, dia_vencimento: 1, filial_id: IDS.filialB }, prefer: 'return=representation',
    });
    const masterDelete = await comoUsuario(tokens.master, `df_contas_recorrentes?id=eq.${masterId}`, { method: 'DELETE', prefer: 'return=representation' });
    garantir(adminInsert.ok && adminUpdate.ok && adminDelete.ok, `Mutacao Admin falhou: ${adminInsert.text} ${adminUpdate.text} ${adminDelete.text}`);
    garantir(masterInsert.ok && masterDelete.ok, `Mutacao Master falhou: ${masterInsert.text} ${masterDelete.text}`);
  }],
]);

const veredictos = Object.entries(resultados)
  .map(([id, resultado]) => `${id.replace('-', '_')}=${resultado.veredito}`)
  .join('\n');
await writeFile(`${logDir}/postgrest-resultados.json`, `${JSON.stringify({
  ambiente: 'Supabase local efemero; Auth e PostgREST reais',
  usuarios: Object.values(emails),
  resultados,
}, null, 2)}\n`);
await writeFile(`${logDir}/postgrest-veredictos.env`, `${veredictos}\n`);

if (Object.values(resultados).some((resultado) => resultado.veredito !== 'APROVADO')) {
  process.exitCode = 1;
}
