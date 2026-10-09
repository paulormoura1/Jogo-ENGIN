import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createResearchMiddleware } from './researchApi.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const research = createResearchMiddleware();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
createServer({ requestTimeout: 15000, headersTimeout: 10000 }, (request, response) => {
  research(request, response, async () => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/Jogo-ENGIN\/?/, '/');
      const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!file.startsWith(resolve(root) + sep)) { response.writeHead(403); response.end(); return; }
      const data = await readFile(file);
      response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
      response.end(data);
    } catch { response.writeHead(404); response.end('Not found'); }
  });
}).listen(Number(process.env.PORT) || 4173, process.env.HOST || '127.0.0.1', () => {
  console.log(`Jogo ENGIN: http://localhost:${Number(process.env.PORT) || 4173}/Jogo-ENGIN/`);
});
