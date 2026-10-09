import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { load } from 'cheerio';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createResearchMiddleware, parseRepositoryResults, parseRepositoryMetadata } from '../server/researchApi.mjs';

const bundle = await build({ entryPoints: ['src/services/scientificSearchService.ts'], bundle: true, platform: 'node', format: 'esm', write: false,
  define: { 'import.meta.env': JSON.stringify({ BASE_URL: '/' }) } });
const { scientificSearch } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const utilBundle = await build({ entryPoints: ['src/services/referenceUtils.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { normalizeDoi, safeArticleLink, dedupeReferences } = await import('data:text/javascript;base64,' + Buffer.from(utilBundle.outputFiles[0].text).toString('base64'));
const localBundle = await build({ entryPoints: ['src/services/localReferenceValidation.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { screenAbstractsLocally } = await import('data:text/javascript;base64,' + Buffer.from(localBundle.outputFiles[0].text).toString('base64'));
const disabledBundle = await build({ entryPoints: ['src/services/scientificSearchService.ts'], bundle: true, platform: 'node', format: 'esm', write: false,
  define: { 'import.meta.env': JSON.stringify({ BASE_URL: '/', VITE_DISABLE_GEMINI: 'true' }) } });
const disabledSearch = (await import('data:text/javascript;base64,' + Buffer.from(disabledBundle.outputFiles[0].text).toString('base64'))).scientificSearch;

const area = 'Governança do Conhecimento';
const challenge = 'Como implantar políticas de governança para compartilhar e reter conhecimento crítico entre equipes?';
const reference = (n, overrides = {}) => ({ title: `Knowledge governance and knowledge retention ${n}`, authors: [`Author ${n}`],
  doi: `10.1234/test-${n}`, link: `https://doi.org/10.1234/test-${n}`, source: 'UFSC', year: 2005,
  abstract: 'Knowledge governance mechanisms coordinate teams and support the retention and sharing of organizational knowledge. Organizational policies clarify responsibilities, enable collaboration and prevent the loss of critical knowledge.', confidence: 0, ...overrides });
const oa = item => ({ title: item.title, type: 'article', doi: item.doi, publication_year: item.year,
  authorships: item.authors.map(name => ({ author: { display_name: name } })),
  abstract_inverted_index: Object.fromEntries(item.abstract.split(' ').map((word, i) => [word, [i]])) });
let calls;
let ufsc;
let externals;
let validation;

beforeEach(() => {
  calls = []; ufsc = []; externals = []; validation = { available: false };
  const storage = new Map();
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  globalThis.DOMParser = class { parseFromString(html) { return { body: { textContent: load(html).text() } }; } };
  globalThis.fetch = async (url, options = {}) => {
    calls.push(String(url));
    if (url.includes('/api/ufsc')) {
      if (ufsc instanceof Error) throw ufsc;
      return Response.json({ candidates: ufsc });
    }
    if (url.includes('/api/validate')) return Response.json(typeof validation === 'function' ? validation(JSON.parse(options.body)) : validation);
    if (url.includes('openalex')) return Response.json({ results: externals.map(oa) });
    if (url.includes('crossref')) return Response.json({ message: { items: [] } });
    throw new Error('Unexpected URL');
  };
});

test('one UFSC work is supplemented by distinct external works, UFSC first', async () => {
  ufsc = [reference(1)]; externals = [reference(1), reference(2), reference(3), reference(4)];
  const result = await scientificSearch({ title: '', area, challenge, proposal: 'Criar políticas', limit: 4 });
  assert.equal(result.candidates.length, 4);
  assert.equal(result.candidates[0].source, 'UFSC');
  assert.equal(new Set(result.candidates.map(c => c.doi)).size, 4);
  assert.equal(result.sourceType, 'mixed');
  assert.equal(result.validation, 'local');
  assert.match(result.notice, /precisa de revisão/);
  assert.ok(calls.findIndex(c => c.includes('openalex')) > calls.findIndex(c => c.includes('/api/ufsc')));
});

test('enough UFSC works avoid external queries', async () => {
  ufsc = [1, 2, 3, 4].map(n => reference(n));
  const result = await scientificSearch({ title: '', area, challenge });
  assert.equal(result.candidates.length, 4);
  assert.equal(result.sourceType, 'ufsc');
  assert.ok(!calls.some(c => c.includes('openalex') || c.includes('crossref')));
});

test('unrelated DOI-bearing works cannot become the best result', async () => {
  externals = [reference(1, { title: 'Marine algae photosynthesis', abstract: 'Photosynthesis in marine plants.' })];
  const result = await scientificSearch({ title: '', area, challenge });
  assert.equal(result.best, null);
  assert.equal(result.candidates.length, 0);
  assert.match(result.notice, /0 obras/);
});

test('missing authors and generic repository links are rejected', async () => {
  ufsc = [reference(1, { authors: [] }), reference(2, { link: 'https://repositorio.ufsc.br/', doi: undefined })];
  const result = await scientificSearch({ title: '', area, challenge });
  assert.equal(result.candidates.length, 0);
});

test('UFSC outage uses external works and explains the limitation', async () => {
  ufsc = new Error('offline'); externals = [1, 2, 3, 4].map(n => reference(n));
  const result = await scientificSearch({ title: '', area, challenge });
  assert.equal(result.candidates.length, 4);
  assert.match(result.notice, /Não foi possível consultar a UFSC/);
});

test('accepted semantic matches have actual retrieved excerpts', async () => {
  ufsc = [1, 2, 3, 4].map(n => reference(n));
  validation = input => ({ available: true, matches: input.candidates.map((item, index) => ({
    index, score: 0.94, reason: 'Relaciona governança à retenção discutida no desafio.', excerpt: item.abstract,
  })) });
  const result = await scientificSearch({ title: '', area, challenge, proposal: 'Retenção' });
  assert.equal(result.validation, 'semantic');
  assert.ok(result.candidates.every(c => c.semanticValidated && c.abstract.includes(c.evidenceExcerpt)));
});

test('hallucinated quotes, absent abstracts and out-of-range indices are rejected', async () => {
  ufsc = [reference(1), reference(2, { abstract: '' })];
  validation = { available: true, matches: [
    { index: 0, score: 0.96, reason: 'Relevant', excerpt: 'This quotation was invented and is not in the retrieved abstract.' },
    { index: 1, score: 0.96, reason: 'Relevant', excerpt: 'A quotation cannot be validated without any retrieved abstract.' },
    { index: 999, score: 0.96, reason: 'Relevant', excerpt: 'Out of bounds' },
  ] };
  const result = await scientificSearch({ title: '', area, challenge });
  assert.equal(result.candidates.length, 0);
});

test('cache separates proposal and area and coalesces identical concurrent searches', async () => {
  ufsc = [1, 2, 3, 4].map(n => reference(n));
  await Promise.all([1, 2].map(() => scientificSearch({ title: '', area, challenge, proposal: 'A' })));
  const count = calls.length;
  await scientificSearch({ title: '', area, challenge, proposal: 'A' });
  assert.equal(calls.length, count);
  await scientificSearch({ title: '', area, challenge, proposal: 'B' });
  assert.ok(calls.length > count);
  const changed = calls.length;
  await scientificSearch({ title: '', area: 'Gestão do Conhecimento', challenge, proposal: 'B' });
  assert.ok(calls.length > changed);
});

test('DOI handling never converts an ordinary URL into a DOI', () => {
  assert.equal(normalizeDoi('https://doi.org/10.1234/ABC'), '10.1234/abc');
  assert.equal(normalizeDoi('https://repositorio.ufsc.br/handle/123456789/123'), '');
  assert.equal(safeArticleLink('https://doi.org/https://repositorio.ufsc.br/handle/1/2'), '');
  assert.equal(safeArticleLink('javascript:alert(1)'), '');
  assert.equal(safeArticleLink('https://repositorio.ufsc.br/discover?query=x'), '');
});

test('duplicate provider records with different DOI and a title typo count once', () => {
  const works = [
    reference(1, { title: 'Knowledge Integration and Information Technology Project Performance1', year: 2006 }),
    reference(2, { title: 'Knowledge integration and infromation technology project performance', year: 2006 }),
    reference(3, { title: 'Knowledge integration and information technology project performance', year: 2007 }),
    reference(4, { title: 'Knowledge integration and information technology project performance part 1', year: 2006 }),
    reference(5, { title: 'Knowledge integration and information technology project performance part 2', year: 2006 }),
  ];
  assert.deepEqual(dedupeReferences(works).map(item => item.doi), [works[0].doi, works[2].doi, works[3].doi, works[4].doi]);
});

test('all four areas return multiple works through the same retrieval flow', async () => {
  const examples = [
    ['Governança do Conhecimento', 'Knowledge governance and organizational policies'],
    ['Gestão do Conhecimento', 'Knowledge management and organizational learning'],
    ['Engenharia da Integração', 'Organizational knowledge integration and systems'],
    ['Universidade Corporativa em Rede', 'Corporate university and network learning'],
  ];
  for (const [researchArea, title] of examples) {
    ufsc = [1, 2, 3, 4].map(n => reference(n, { title: `${title} ${n}`, abstract: `${title}. This research studies organizational policies, knowledge mechanisms and learning processes in organizations, examining practices for collaboration and the development of professional competencies.` }));
    const result = await scientificSearch({ title: researchArea, area: researchArea, challenge: 'Como melhorar a aprendizagem entre equipes?', limit: 4 });
    assert.equal(result.candidates.length, 4, researchArea);
    assert.equal(result.sourceType, 'ufsc', researchArea);
  }
});

test('UFSC parser selects item links and obtains actual creators and abstract', () => {
  const hits = parseRepositoryResults('<a href="/handle/123456789/9">Navigation</a><div class="artifact-title"><a href="/handle/123456789/123">Research title</a></div>');
  assert.equal(hits.length, 1);
  const metadata = parseRepositoryMetadata(`<meta name="DC.title" content="Research title"><meta name="DC.creator" content="Researcher">
    <meta name="DC.contributor" content="Advisor"><meta name="citation_author" content="Researcher">
    <meta name="citation_date" content="2005"><meta name="DC.description" content="Dissertation affiliation, not the abstract">
    <meta name="DCTERMS.abstract" content="Actual scientific abstract">`, hits[0].link);
  assert.deepEqual(metadata.authors, ['Researcher']);
  assert.equal(metadata.abstract, 'Actual scientific abstract');
  assert.equal(metadata.year, 2005);
});

test('calibrated evaluator and area thresholds remain exactly as in the original repository', async () => {
  const original = execFileSync('git', ['show', '9685c3d:App.tsx'], { encoding: 'utf8' }).replace(/\r\n/g, '\n');
  const updated = (await readFile('App.tsx', 'utf8')).replace(/\r\n/g, '\n');
  const evaluator = text => text.slice(text.indexOf('const evaluateProposalWithSources'), text.indexOf('\nfunction withTimeout') >= 0 ? text.indexOf('\nfunction withTimeout') : text.indexOf('\nconst App: React.FC')).trim();
  assert.equal(evaluator(updated), evaluator(original));
  const thresholds = text => text.slice(text.indexOf('const localScore'), text.indexOf('// 3️⃣ UFSC-FIRST') >= 0 ? text.indexOf('// 3️⃣ UFSC-FIRST') : text.indexOf('// Reference retrieval')).trim();
  assert.equal(thresholds(updated), thresholds(original));
});

test('local screening requires substantive matching in the abstract, not just the title', () => {
  const query = { title: '', area, challenge, proposal: 'Reter e compartilhar conhecimento' };
  const works = [reference(1), reference(2, { abstract: '' }), reference(3, { abstract:
    'Marine researchers analyzed photosynthesis in algae and the biological development of ocean ecosystems. They measured light intensity and found patterns unrelated to organizational management or human knowledge processes.' })];
  const result = screenAbstractsLocally(works, query);
  assert.equal(result.length, 1);
  assert.equal(result[0].validationMethod, 'local');
  assert.equal(result[0].semanticValidated, false);
  assert.ok(result[0].abstract.includes(result[0].evidenceExcerpt));
  assert.match(result[0].relevanceReason, /Assuntos encontrados no resumo/);
});

test('local screening rejects a shared domain when the actual problem is different', () => {
  const wrong = reference(1, { abstract: 'Knowledge governance and sharing improve how employees work together in an organization. The study analyzes policies for collaboration and communication between departments, with no discussion of retaining expertise when employees leave.' });
  // No retention term appears; matching the area and sharing alone is insufficient.
  const result = screenAbstractsLocally([wrong], { title: '', area, challenge, proposal: '' });
  assert.equal(result.length, 0);
});

test('forced no-Gemini mode never requests model validation', async () => {
  ufsc = [1, 2, 3, 4].map(n => reference(n));
  const result = await disabledSearch({ title: '', area, challenge });
  assert.equal(result.candidates.length, 4);
  assert.equal(result.validation, 'local');
  assert.ok(!calls.some(url => url.includes('/validate') || url.includes('generativelanguage')));
});

test('OpenAlex authors are reconciled with the canonical DOI registry', async () => {
  externals = [reference(1, { authors: ['Incorrect author'] })];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => String(url).includes('/works/10.')
    ? Response.json({ message: { DOI: '10.1234/test-1', title: [externals[0].title], author: [{ given: 'Correct', family: 'Author' }], type: 'journal-article' } })
    : previousFetch(url, options);
  const result = await scientificSearch({ title: '', area, challenge });
  assert.deepEqual(result.candidates[0].authors, ['Correct Author']);
  assert.equal(result.candidates[0].metadataVerified, true);
});

test('corrupted cache and malformed repository records do not suppress valid works', async () => {
  globalThis.localStorage.getItem = () => JSON.stringify({ exp: Date.now() + 60000, result: { notice: '', candidates: [null] } });
  ufsc = [null, { title: 123 }, reference(1)];
  const result = await scientificSearch({ title: '', area, challenge });
  assert.equal(result.candidates.length, 1);
});

test('server disable flag prevents Gemini use even if a key exists', async () => {
  let body;
  const middleware = createResearchMiddleware({ GEMINI_API_KEY: 'test-only-never-used', DISABLE_GEMINI: 'true' });
  await middleware({ url: '/api/validate', method: 'POST' }, { writeHead() {}, end(value) { body = JSON.parse(value); } }, () => assert.fail('Unexpected next'));
  assert.equal(body.available, false);
  assert.equal(calls.length, 0);
});

test('existing local challenges work in all areas with Gemini disabled and unavailable storage', async () => {
  const compiled = await build({ entryPoints: ['geminiService.ts'], bundle: true, platform: 'browser', format: 'esm', write: false,
    define: { 'import.meta.env': JSON.stringify({ VITE_GEMINI_API_KEY: 'test-only-never-used', VITE_DISABLE_GEMINI: 'true' }) } });
  const { generateChallenge } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  globalThis.sessionStorage = { getItem() { throw new Error('Storage unavailable'); }, setItem() { throw new Error('Storage unavailable'); } };
  for (const researchArea of ['Governança do Conhecimento', 'Gestão do Conhecimento', 'Engenharia da Integração', 'Universidade Corporativa em Rede']) {
    const descriptions = new Set();
    for (let i = 0; i < 5; i++) {
      const value = await generateChallenge(researchArea);
      assert.ok(value.title && value.description, researchArea);
      assert.ok(!descriptions.has(value.description), researchArea);
      descriptions.add(value.description);
    }
  }
  assert.equal(calls.length, 0);
});
