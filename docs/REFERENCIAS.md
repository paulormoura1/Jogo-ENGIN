# Referências científicas — revisão local

**Atualização de 09/10/2026:** foi preparado um modo para jogar no GitHub Pages sem servidor próprio, usando um catálogo datado da UFSC e consultas externas. Veja [PUBLICACAO.md](PUBLICACAO.md). O fluxo de consulta UFSC ao vivo descrito abaixo continua disponível no modo com servidor.

O pedido é apresentar pelo menos três obras pertinentes nas quatro áreas, priorizando o Repositório Institucional da UFSC. A quantidade é uma meta: se não houver três obras que passem pelos critérios, o jogo informa a insuficiência em vez de inserir referências sem relação suficiente.

## O que foi preservado

- Avaliador local, palavras-chave, equivalências conceituais, notas e limites de pontuação de cada área.
- Banco de desafios e instruções de geração dos desafios.
- Cadastro de participantes, classificação e navegação entre as quatro áreas.

Os testes comparam o avaliador, os limites de pontuação, os bancos de fontes, o banco de desafios, subtemas e as instruções de geração com o commit `9685c3d`.

## Fluxo das referências

1. Identificar a área e os assuntos do desafio. Criar consultas curtas em português e inglês, sem inventar títulos de artigos.
2. Consultar `/discover` no repositório da UFSC, usando o serviço local. Recuperar as páginas das obras e seus autores, datas e resumos.
3. Filtrar obras com metadados suficientes, link específico e aderência ao domínio e aos assuntos do desafio.
4. Quando `GEMINI_API_KEY` estiver configurada no servidor, avaliar o problema, o mecanismo e o contexto apresentados nos resumos, considerando também a proposta do jogador. O modelo seleciona somente obras já recuperadas. O programa exige que o trecho citado exista literalmente no resumo.
5. Se faltarem obras, ampliar para OpenAlex e Crossref. Repetir a validação, remover duplicatas e apresentar até quatro obras, com as da UFSC primeiro. Conferir a autoria de registros OpenAlex com DOI no Crossref quando disponível. O tipo exibido é o informado pela fonte, que pode conter erros de catálogo.

A seleção das obras não determina nem altera a nota. Uma referência pode servir para orientar a correção de uma proposta incorreta.

Sem o serviço de avaliação de conteúdo, o filtro local exige resumo, verifica os assuntos do desafio e apresenta um trecho literal para revisão. A proposta ajuda na ordenação. Esse processo usa regras e não comprova sustentação científica. Mesmo a avaliação automatizada com IA exige revisão acadêmica; ela não substitui a leitura do texto completo, nem representa garantia de 100% de correspondência.

Veja as opções completas de execução em [CONFIGURAR_GEMINI.md](CONFIGURAR_GEMINI.md) e o roteiro de revisão em [PROMPT_REVISAO_ASTRA.md](PROMPT_REVISAO_ASTRA.md).

## Executar localmente

Requisito: Node.js 22.9 ou superior.

```text
npm install
npm run dev
```

Abra `http://127.0.0.1:5173/Jogo-ENGIN/` (ou a porta indicada no terminal). O serviço de referências funciona junto ao servidor de desenvolvimento.

Copie `.env.example` para `.env.local` e configure, se disponíveis:

- `GEMINI_API_KEY`: chave privada usada exclusivamente no servidor para avaliar os resumos.
- `GEMINI_REFERENCE_MODEL`: modelo de avaliação; padrão `gemini-3.8-flash`.
- `VITE_USE_GEMINI_CHALLENGES` e `ENABLE_GEMINI_CHALLENGES`: habilitam juntos a geração no servidor. A chave privada nunca vai ao navegador; sem as duas opções, o banco original é utilizado.
- `VITE_RESEARCH_API_URL`: endereço do serviço de referências quando hospedado separadamente. Deixe vazio para executar aplicação e serviço na mesma origem.

Não coloque a chave privada da avaliação em uma variável com prefixo `VITE_` nem em arquivos enviados ao GitHub.

## Verificações

```text
npm test
npm run typecheck
npm run build
```

Os testes verificam a prioridade da UFSC, a ampliação quando há apenas uma obra, duplicatas, referências sem autores, links genéricos, falhas de consulta, cache por área/desafio/proposta, rejeição de artigos fora do tema, validação dos trechos citados e preservação da calibração.

Para executar a versão compilada com o serviço de referências:

```text
npm run build
npm start
```

Abra `http://127.0.0.1:4173/Jogo-ENGIN/`. O endereço padrão do servidor é local. Configure `HOST` e `PORT` na hospedagem conforme a plataforma escolhida.

## Hospedagem e bases restritas

O GitHub Pages hospeda arquivos estáticos; não executa o serviço de consulta da UFSC nem a avaliação privada de resumos. Para publicar o fluxo completo, é necessário hospedar o serviço Node junto à aplicação ou configurar um serviço externo. O envio da branch de revisão ao GitHub não altera o jogo publicado; o workflow só publica quando houver atualização na main.

Os links Google Acadêmico, ERIC e Scopus são atalhos para pesquisar a obra. Eles não significam que o aplicativo consultou essas bases, nem que a publicação foi indexada nelas.

Não há integração direta implementada com Scopus ou Web of Science. Elas exigem credenciais e condições de acesso próprias. Fontes oficiais: [Scopus APIs](https://dev.elsevier.com/sc_apis.html) e [Clarivate Developer Portal](https://developer.clarivate.com/). As fontes abertas efetivamente consultadas são [OpenAlex](https://help.openalex.org/api/) e [Crossref](https://api.crossref.org/).

O código revisado trata da aplicação web. A embalagem e publicação no Google Play serão uma etapa separada, após a validação funcional e acadêmica das referências.
