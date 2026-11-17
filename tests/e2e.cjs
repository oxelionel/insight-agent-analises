// Teste ponta a ponta do Insight Agent (Playwright, Chromium headless)
// Uso: sirva o build (ex.: npm run preview) e execute BASE=http://localhost:4173/ node tests/e2e.cjs
// Requer o pacote 'playwright' instalado (npm i -D playwright && npx playwright install chromium).
const { chromium } = (() => { try { return require('playwright'); } catch { return require(process.env.PLAYWRIGHT_PATH); } })();
const fs = require('fs');
const TMP = require('os').tmpdir();
const BASE = process.env.BASE || 'http://localhost:5173/index.html';
const SHOTS = process.env.SHOTS || require('path').join(__dirname, '../docs/screenshots');
const results = [];
const ok = (name, cond, extra = '') => { results.push({ name, pass: !!cond, extra }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('dialog', (d) => d.dismiss());

  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '#/dashboard');
  await page.waitForSelector('text=O que o mercado está dizendo?');

  // 1. Navegação por todas as páginas + screenshots
  const pages = ['dashboard', 'empresa', 'monitoramento', 'analise', 'concorrentes', 'oportunidades', 'solucoes', 'planos', 'relatorios', 'apresentacoes', 'historico', 'configuracoes'];
  for (const p of pages) {
    await page.goto(`${BASE}#/${p}`);
    await page.waitForTimeout(450);
    const h1 = await page.locator('main h1').first().textContent().catch(() => '');
    ok(`navegação: ${p}`, h1 && h1.length > 2, `→ "${h1}"`);
    await page.screenshot({ path: `${SHOTS}/${String(pages.indexOf(p) + 1).padStart(2, '0')}-${p}.png`, fullPage: p === 'dashboard' });
  }

  // 2. KPIs calculados
  await page.goto(`${BASE}#/dashboard`);
  const kpi = async (label) => Number(await page.locator(`button:has-text("${label}") p.text-\\[28px\\]`).first().textContent());
  ok('dashboard: manifestações analisadas = 32', (await kpi('Manifestações analisadas')) === 32);
  ok('dashboard: aguardando autorização = 1', (await kpi('Aguardando autorização')) === 1);

  // 3. Cadastro de manifestação
  await page.goto(`${BASE}#/monitoramento`);
  const before = await page.locator('main ul > li').count();
  await page.click('button:has-text("Adicionar manifestação")');
  await page.fill('textarea', 'O aplicativo trava toda vez que tento pagar e ninguém responde no chat.');
  await page.waitForSelector('text=Prévia:');
  const preview = await page.locator('text=Prévia:').textContent();
  await page.click('div[role=dialog] button:has-text("Adicionar manifestação")');
  await page.waitForTimeout(300);
  const after = await page.locator('main ul > li').count();
  ok('cadastro de manifestação', after === before + 1, `(${before}→${after}; ${preview.trim()})`);

  // 4. Filtros
  await page.selectOption('select[aria-label="Sentimento"]', 'positivo');
  const pos = await page.locator('main ul > li').count();
  ok('filtro por sentimento positivo', pos === 5, `(${pos})`);
  await page.click('button:has-text("Limpar filtros")');
  await page.selectOption('select[aria-label="Status"]', 'pendente');
  const pend = await page.locator('main ul > li').count();
  ok('filtro por status pendente', pend === 7, `(${pend})`);
  await page.click('button:has-text("Limpar filtros")');
  await page.fill('input[aria-label="Buscar manifestações"]', 'garantia');
  ok('busca por texto', (await page.locator('main ul > li').count()) >= 2);
  await page.click('button:has-text("Limpar filtros")');

  // 5. Exclusão com confirmação
  const n0 = await page.locator('main ul > li').count();
  await page.locator('main ul > li').last().locator('button[aria-label="Excluir"]').click();
  await page.click('div[role=dialog] button:has-text("Excluir")');
  await page.waitForTimeout(200);
  ok('exclusão com confirmação', (await page.locator('main ul > li').count()) === n0 - 1);

  // 6. Análise
  await page.click('button:has-text("Analisar manifestações")');
  await page.waitForSelector('text=Análise concluída.', { timeout: 8000 });
  const res = await page.locator('div[role=dialog] .bg-emerald-50').textContent();
  ok('análise executada', /incorporada/.test(res), `(${res.replace(/\s+/g, ' ').slice(0, 90)})`);
  await page.click('div[role=dialog] button:has-text("Ver resultados")');
  await page.waitForSelector('text=Problemas identificados');
  const probs = await page.locator('main button:has-text("Gravidade")').count();
  ok('problemas identificados = 8', probs === 8, `(${probs})`);

  // 7. Criar oportunidade a partir de problema e gerar solução
  await page.click('main button:has-text("Instabilidade do aplicativo")');
  await page.click('button:has-text("Gerar oportunidade")');
  await page.waitForSelector('button:has-text("Ver oportunidade")');
  ok('oportunidade criada a partir do problema', true);
  await page.click('button:has-text("Elaborar solução")');
  await page.waitForSelector('button:has-text("Gerar solução estratégica")');
  await page.click('main button.h-11:has-text("Gerar solução estratégica")');
  await page.waitForSelector('text=Recomendação final', { timeout: 8000 });
  const solTitle = await page.locator('main h2').first().textContent();
  ok('solução estratégica gerada', /estabilização do aplicativo/i.test(solTitle), `("${solTitle}")`);
  const ctxText = (await page.locator('main li').allTextContents()).filter((t) => t.includes('Evidência (')).join(' | ');
  ok('solução usa evidências reais do sistema', /trava|login|Site caiu/.test(ctxText));

  // 8. Plano de ação
  await page.click('button:has-text("Criar plano de implementação")');
  await page.waitForSelector('text=Planos de implementação');
  await page.waitForSelector('h2:has-text("Plano de estabilização do aplicativo")');
  ok('plano de ação criado', true);
  await page.locator('main input[type=checkbox]').first().check();
  await page.waitForTimeout(150);
  const prog = await page.locator('text=/\\d+% concluído/').first().textContent();
  ok('checklist atualiza progresso', /25%/.test(prog), `(${prog})`);
  await page.locator('input[aria-label="Responsável"]').first().fill('Equipe Mobile (demo)');
  await page.click('button:has-text("Cronograma")');
  ok('cronograma exibido', await page.locator('text=Linha vermelha: data atual').isVisible());
  await page.click('button:has-text("Checklist")');

  // 9. Fluxo de autorização
  await page.click('button:has-text("Solicitar autorização")');
  await page.click('div[role=dialog] button:has-text("Enviar para autorização")');
  await page.waitForSelector('button:has-text("Revisar e autorizar")');
  await page.click('button:has-text("Revisar e autorizar")');
  const approve = page.locator('div[role=dialog] button:has-text("Aprovar")');
  ok('aprovar bloqueado sem confirmação explícita', await approve.isDisabled());
  await page.check('div[role=dialog] label:has-text("Confirmo que revisei a proposta") input');
  ok('aprovar liberado após confirmação', await approve.isEnabled());
  await approve.click();
  await page.waitForSelector('button:has-text("Executar melhoria (demonstração)")');
  ok('status mudou para aprovado', await page.locator('main span:has-text("Aprovado")').first().isVisible());

  // 10. Execução demonstrativa
  await page.click('button:has-text("Executar melhoria (demonstração)")');
  await page.click('button:has-text("Iniciar execução simulada")');
  await page.waitForSelector('text=Melhoria concluída na demonstração', { timeout: 10000 });
  await page.click('div[role=dialog] button:has-text("Concluir")');
  ok('execução demonstrativa concluída', await page.locator('main h2 + p, main').locator('text=Registro da execução demonstrativa').isVisible());

  // 11. Persistência
  await page.reload();
  await page.goto(`${BASE}#/planos`);
  await page.waitForTimeout(400);
  const firstPlan = await page.locator('main button:has-text("Plano de estabilização")').first().textContent();
  ok('persistência após recarregar', /Concluído/.test(firstPlan));
  await page.goto(`${BASE}#/dashboard`);
  ok('dashboard: implementadas = 1', (await kpi('Implementadas (demo)')) === 1);

  // 12. Histórico
  await page.goto(`${BASE}#/historico`);
  await page.selectOption('select[aria-label="Tipo de atividade"]', 'melhoria_aprovada');
  const appr = await page.locator('main ol > li').count();
  ok('histórico registra aprovação', appr >= 2, `(${appr})`);
  await page.selectOption('select[aria-label="Tipo de atividade"]', 'execucao_realizada');
  ok('histórico registra execução', (await page.locator('main ol > li').count()) >= 2);

  // 13. Minha empresa
  await page.goto(`${BASE}#/empresa`);
  await page.locator('textarea').first().fill('Descrição editada no teste.');
  await page.click('button:has-text("Salvar alterações")');
  await page.waitForSelector('text=Dados da empresa salvos');
  ok('edição da empresa', true);

  // 14. Concorrentes: lacuna vira oportunidade
  await page.goto(`${BASE}#/concorrentes`);
  const gapsN = await page.locator('text=O que os concorrentes oferecem').count();
  ok('seção de lacunas competitivas', gapsN === 1);
  const btn = page.locator('main button:has-text("Criar oportunidade")').first();
  if (await btn.count()) { await btn.click(); await page.waitForSelector('text=Radar de oportunidades'); ok('lacuna competitiva vira oportunidade', true); }

  // 15. Relatório + PDF
  await page.goto(`${BASE}#/relatorios`);
  await page.click('button:has-text("Gerar relatório")');
  await page.waitForSelector('text=Último relatório gerado');
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: `${TMP}/relatorio.pdf`, format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  ok('relatório PDF gerado', fs.statSync(`${TMP}/relatorio.pdf`).size > 50000, `(${Math.round(fs.statSync(`${TMP}/relatorio.pdf`).size / 1024)} KB)`);

  // 16. Apresentação: navegação, edição e PPTX
  await page.goto(`${BASE}#/apresentacoes`);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const pos3 = await page.locator('text=/^3 \\/ 12/').count().catch(() => 0);
  const label = await page.locator('main span:has-text("/ 12")').first().textContent();
  ok('navegação de slides', /3/.test(label), `(${label})`);
  await page.click('button:has-text("Editar textos")');
  const h = page.locator('.print-hide [contenteditable=true]').first();
  await h.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' (editado)');
  await page.click('button:has-text("Concluir edição")');
  ok('edição de texto do slide', /editado/.test(await page.locator('.print-hide .slide h2').first().textContent()));
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('button:has-text("Exportar PPTX")')]);
  await dl.saveAs(`${TMP}/apresentacao.pptx`);
  ok('PPTX exportado', fs.statSync(`${TMP}/apresentacao.pptx`).size > 20000, `(${Math.round(fs.statSync(`${TMP}/apresentacao.pptx`).size / 1024)} KB, ${dl.suggestedFilename()})`);
  await page.click('button:has-text("Apresentar")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/13-modo-apresentacao.png` });
  await page.keyboard.press('Escape');

  // 17. Responsivo (tablet)
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto(`${BASE}#/dashboard`);
  await page.waitForTimeout(400);
  await page.click('button[aria-label="Abrir menu"]');
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${SHOTS}/14-tablet-menu.png` });
  ok('menu responsivo em tablet', await page.locator('aside.sidebar button:has-text("Concorrentes")').isVisible());
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('sem rolagem horizontal no tablet', overflow <= 1, `(${overflow}px)`);

  ok('sem erros de JavaScript no console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} verificações passaram`);
  fs.writeFileSync(`${TMP}/results.json`, JSON.stringify(results, null, 2));
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('ERRO', e); process.exit(2); });
