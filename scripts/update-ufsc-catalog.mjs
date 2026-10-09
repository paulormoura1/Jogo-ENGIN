// Public metadata only. Run explicitly before publishing; never needs a Gemini key.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { searchRepository } from '../server/researchApi.mjs';

async function compile(options) {
  const result = await build({ ...options, bundle: true, platform: 'node', format: 'esm', write: false,
    define: { 'import.meta.env': '{}' } });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const { bank } = await compile({ stdin: { contents: await readFile('geminiService.ts', 'utf8') + '\nexport { FALLBACK_CHALLENGES as bank };', resolveDir: process.cwd(), loader: 'ts' } });
const { researchPlan } = await compile({ entryPoints: ['src/services/researchTopics.ts'] });
const catalog = { version: 1, retrievedAt: new Date().toISOString(), areas: {}, queries: [] };
for (const [area, challenges] of Object.entries(bank)) {
  const queries = [...new Set(challenges.flatMap(challenge => researchPlan(area, challenge.description).ufscQueries))];
  const works = new Map();
  // Two queries at a time, with the repository service's own bounded page reads.
  for (let index = 0; index < queries.length; index += 2) {
    await Promise.all(queries.slice(index, index + 2).map(async query => {
      try {
        const candidates = await searchRepository(query);
        for (const work of candidates) works.set(work.link, work);
        catalog.queries.push({ area, query, count: candidates.length, ok: true });
      } catch {
        catalog.queries.push({ area, query, count: 0, ok: false });
      }
    }));
  }
  catalog.areas[area] = [...works.values()];
  console.log(`${area}: ${works.size} obras, ${queries.length} consultas`);
}
// Never replace a usable catalog with an incomplete retrieval after an outage.
if (catalog.queries.some(query => !query.ok) || Object.values(catalog.areas).some(works => !works.length)) {
  console.error('Consulta incompleta. O catálogo anterior foi preservado. Tente novamente.');
  process.exitCode = 1;
} else {
  await mkdir('public', { recursive: true });
  await writeFile('public/ufsc-catalog.json', JSON.stringify(catalog, null, 2) + '\n');
  console.log('Catálogo salvo em public/ufsc-catalog.json. São candidatos, não referências academicamente validadas.');
}
