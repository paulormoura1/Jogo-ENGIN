import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { load } from 'cheerio';
import { searchRepository } from '../server/researchApi.mjs';

async function compiled(file) {
  const result = await build({ entryPoints: [file], bundle: true, platform: 'node', format: 'esm', write: false,
    // Even inconsistent optional Gemini flags must not enable API calls on Pages.
    define: { 'import.meta.env': JSON.stringify({ BASE_URL: '/Jogo-ENGIN/', VITE_STATIC_REFERENCES: 'true', VITE_USE_GEMINI_CHALLENGES: 'true' }) } });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const { scientificSearch } = await compiled('src/services/scientificSearchService.ts');
const { generateChallenge } = await compiled('geminiService.ts');
const catalog = JSON.parse(await readFile('public/ufsc-catalog.json', 'utf8'));
const previous = JSON.parse(await readFile('artifacts/review-live.json', 'utf8'));
let calls, catalogResponse, externalFailure;
beforeEach(() => {
  calls = []; catalogResponse = catalog; externalFailure = false;
  const storage = new Map();
  globalThis.localStorage = globalThis.sessionStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) };
  globalThis.DOMParser = class { parseFromString(html) { return { body: { textContent: load(html).text() } }; } };
  globalThis.fetch = async url => {
    calls.push(String(url));
    if (String(url) === '/Jogo-ENGIN/ufsc-catalog.json') {
      if (catalogResponse instanceof Error) throw catalogResponse;
      return Response.json(catalogResponse);
    }
    if (String(url).startsWith('https://api.openalex.org/')) {
      if (externalFailure) throw Error('Offline');
      return Response.json({ results: [] });
    }
    if (String(url).startsWith('https://api.crossref.org/')) {
      if (externalFailure) throw Error('Offline');
      return Response.json({ message: { items: [] } });
    }
    throw Error('Unexpected API request');
  };
});

test('Pages selects actual UFSC catalog works for all four sample challenges without a server or Gemini', async () => {
  assert.equal(catalog.version, 1);
  assert.ok(Number.isFinite(Date.parse(catalog.retrievedAt)));
  for (const entry of previous.results) {
    const result = await scientificSearch({ area: entry.area, title: entry.challenge.title, challenge: entry.challenge.description });
    assert.ok(result.candidates.length > 0, entry.area);
    assert.ok(result.candidates.every(work => work.source === 'UFSC' && work.validationMethod === 'local' && !work.semanticValidated));
    assert.ok(result.candidates.every(work => work.abstract.includes(work.evidenceExcerpt)));
    assert.equal(new Set(result.candidates.map(work => work.link)).size, result.candidates.length);
    assert.match(result.notice, /catálogo atualizado em/);
    assert.match(result.notice, /precisa de revisão/);
    const challenge = await generateChallenge(entry.area);
    assert.ok(challenge.title && challenge.description);
  }
  assert.ok(calls.every(url => !url.includes('/api/') && !url.includes('generativelanguage')));
});

test('external outage preserves catalog readings and reports incomplete search', async () => {
  externalFailure = true;
  const entry = previous.results[0];
  const result = await scientificSearch({ area: entry.area, title: entry.challenge.title, challenge: entry.challenge.description });
  assert.ok(result.candidates.length > 0);
  assert.match(result.notice, /indisponível/);
});

test('missing or malformed catalog fails visibly without crashing or calling a server', async () => {
  const entry = previous.results[0];
  for (const [index, value] of [new Error('Offline'), { version: 1, retrievedAt: 'invalid', areas: {} }].entries()) {
    catalogResponse = value;
    const result = await scientificSearch({ area: entry.area, title: entry.challenge.title, challenge: entry.challenge.description, proposal: String(index) });
    assert.equal(result.candidates.length, 0);
    assert.match(result.notice, /Não foi possível consultar a UFSC/);
  }
  assert.ok(calls.every(url => !url.includes('/api/')));
});

test('unrelated and invalid catalog entries cannot pad the count', async () => {
  const entry = previous.results[0];
  const good = catalog.areas[entry.area][0];
  catalogResponse = { ...catalog, areas: { [entry.area]: [good, good,
    { ...good, title: 'Marine algae', abstract: 'Photosynthesis in marine plants.', link: 'https://repositorio.ufsc.br/handle/123456789/999999999' },
    { ...good, authors: [] }, { ...good, link: 'https://example.com/handle/1/2' },
  ] } };
  const result = await scientificSearch({ area: entry.area, title: entry.challenge.title, challenge: entry.challenge.description });
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].link, good.link);
});

test('UFSC access verification is reported as unavailable, not an empty successful search', async () => {
  globalThis.fetch = async () => new Response('<html><body>Sistema de Prevenção de Ataques da RedeUFSC</body></html>');
  await assert.rejects(searchRepository('test-access-verification'), /access verification required/);
});
