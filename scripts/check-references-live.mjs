// Opt-in live smoke check. Uses public sources and explicitly disables Gemini.
import { build } from 'esbuild';
import { load } from 'cheerio';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.env.RESEARCH_TEST_ORIGIN || 'http://127.0.0.1:5173';
async function compiled(file) {
  const result = await build({ entryPoints: [file], bundle: true, platform: 'node', format: 'esm', write: false,
    define: { 'import.meta.env': JSON.stringify({ BASE_URL: '/Jogo-ENGIN/', VITE_DISABLE_GEMINI: 'true' }) } });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const { scientificSearch } = await compiled('src/services/scientificSearchService.ts');
const { getLocalChallenge } = await compiled('geminiService.ts');
const { researchAreas } = await import('../server/challengePrompt.mjs');
const storage = new Map();
globalThis.localStorage = globalThis.sessionStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) };
globalThis.DOMParser = class { parseFromString(html) { return { body: { textContent: load(html).text() } }; } };
const originalFetch = globalThis.fetch;
let modelRequests = 0;
globalThis.fetch = (url, options) => {
  if (/validate|challenge|generativelanguage/.test(String(url))) { modelRequests++; throw Error('Unexpected model request'); }
  return originalFetch(new URL(url, origin), options);
};
const results = [];
for (const area of researchAreas) {
  const random = Math.random; Math.random = () => 0;
  const challenge = getLocalChallenge(area); Math.random = random;
  const start = Date.now();
  const result = await scientificSearch({ title: challenge.title, challenge: challenge.description, area, proposal: '', limit: 4 });
  results.push({ area, challenge, durationMs: Date.now() - start, ...result });
  console.log(JSON.stringify({ area, challenge: challenge.title, count: result.candidates.length, notice: result.notice,
    works: result.candidates.map(item => ({ title: item.title, authors: item.authors, source: item.source, type: item.documentType, link: item.link })), trace: result.trace }));
}
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/review-live.json', JSON.stringify({ date: new Date().toISOString(), modelRequests, results }, null, 2));
if (modelRequests) process.exitCode = 1;
console.log(`Saved artifacts/review-live.json; model requests: ${modelRequests}`);
