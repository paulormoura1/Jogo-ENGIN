# Jogo ENGIN

**Jogar:** https://paulormoura1.github.io/Jogo-ENGIN/

Informe seu nome, toque em **ADD**, depois em **Iniciar operação**. Escolha uma área, responda ao desafio e envie sua proposta. O resultado mostra a pontuação e sugestões de leitura com autores e links.

A versão do GitHub Pages funciona sem instalação e sem chave Gemini. Usa os desafios e a pontuação originais, um catálogo de obras da UFSC e consultas a fontes acadêmicas abertas. As sugestões precisam ser conferidas pelo responsável acadêmico; três obras por desafio não são garantidas. A quantidade de referências não altera a nota.

O histórico e a classificação ficam no navegador utilizado. Abrir em outro aparelho ou apagar os dados do navegador não transfere os resultados.

## Desenvolvimento

Node.js 22.9 ou superior:

```text
npm ci --legacy-peer-deps
npm run dev
```

Para reproduzir a versão do Pages, configure em `.env.local`:

```dotenv
VITE_STATIC_REFERENCES=true
VITE_DISABLE_GEMINI=true
```

Depois execute `npm run build` e `npm start`. Abra http://127.0.0.1:4173/Jogo-ENGIN/.

```text
npm test
npm run typecheck
npm run build
```

As consultas diretas à UFSC e o Gemini opcional são documentados em [CONFIGURAR_GEMINI.md](docs/CONFIGURAR_GEMINI.md). O modo publicado, suas limitações e a recuperação da versão anterior estão em [PUBLICACAO.md](docs/PUBLICACAO.md).
