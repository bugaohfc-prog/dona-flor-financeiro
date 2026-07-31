import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { chromium } from 'playwright';

const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:4173';
const logDir = process.env.LOG_DIR || 'artifacts/redteam-p0-postgrest';
const email = 'gerente-postgrest@ci.local';
const password = 'CI-PostgREST-P0-2026!';

await mkdir(logDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const evidencias = [];

function registrar(nome) {
  evidencias.push({ nome, status: 'APROVADO' });
  console.log(`ok - Playwright - ${nome}`);
}

try {
  await page.goto(frontendUrl, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('E-mail').fill(email);
  await page.getByPlaceholder('Senha').fill(password);
  await page.getByRole('button', { name: /^Entrar$/ }).click();
  await page.waitForFunction(() => !document.body.innerText.includes('Acesse sua conta'), null, { timeout: 20000 });
  registrar('login com JWT local real');

  await page.goto(`${frontendUrl}/?tela=contas`, { waitUntil: 'networkidle' });
  await page.getByText('Conta HTTP A', { exact: true }).first().waitFor({ timeout: 20000 });
  const contasTexto = await page.locator('body').innerText();
  if (contasTexto.includes('Conta HTTP B') || contasTexto.includes('Conta HTTP sem filial')) {
    throw new Error('Tela Contas exibiu dados fora da filial do JWT restrito');
  }
  registrar('Contas respeita escopo de filial pelo PostgREST');
  await page.screenshot({ path: `${logDir}/playwright-contas.png`, fullPage: true });

  await page.goto(`${frontendUrl}/?tela=recorrencias`, { waitUntil: 'networkidle' });
  await page.getByText('Serie HTTP A', { exact: true }).first().waitFor({ timeout: 20000 });
  const recorrenciasTexto = await page.locator('body').innerText();
  if (recorrenciasTexto.includes('Serie HTTP B') || recorrenciasTexto.includes('Serie HTTP sem filial')) {
    throw new Error('Tela Recorrencias exibiu serie fora do escopo do JWT restrito');
  }
  registrar('Recorrencias preserva SELECT permitido sem vazar outras filiais');
  await page.screenshot({ path: `${logDir}/playwright-recorrencias.png`, fullPage: true });

  await writeFile(`${logDir}/playwright-resultados.json`, `${JSON.stringify({ veredito: 'APROVADO', evidencias }, null, 2)}\n`);
} catch (error) {
  await page.screenshot({ path: `${logDir}/playwright-falha.png`, fullPage: true }).catch(() => {});
  await writeFile(`${logDir}/playwright-resultados.json`, `${JSON.stringify({
    veredito: 'BLOQUEADO',
    evidencias,
    erro: error instanceof Error ? error.message : String(error),
  }, null, 2)}\n`);
  throw error;
} finally {
  await browser.close();
}
