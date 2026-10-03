# Usar o jogo com ou sem Gemini

A consulta anterior confirmou o secret GitHub VITE_GEMINI_API_KEY, sem revelar seu valor nem verificar sua validade. A revisão removeu o uso dessa variável no navegador e no workflow. Todas as chamadas Gemini agora usam GEMINI_API_KEY somente no servidor. Nenhum secret foi alterado.

## Sem Gemini

O banco original de desafios e a avaliação funcionam sem chaves. A busca usa UFSC, OpenAlex e Crossref e precisa de internet; consultar a UFSC também exige o serviço Node incluído no projeto.

Crie ou edite .env.local, preservando outras configurações, com estas linhas:

    VITE_DISABLE_GEMINI=true
    DISABLE_GEMINI=true

Execute npm install e npm run dev. Abra o endereço indicado no terminal, normalmente http://127.0.0.1:5173/Jogo-ENGIN/. Reinicie o servidor após alterar variáveis. Variáveis VITE_ exigem novo build na versão compilada.

A triagem local pode retornar menos de três obras e não comprova sustentação científica. Os falsos positivos identificados ganharam testes de regressão; a leitura dos textos completos e a adequação acadêmica continuam dependendo de Paulo.

## Gemini para avaliar referências

Obtenha uma chave válida no [Google AI Studio](https://aistudio.google.com/apikey), conforme o [guia oficial](https://ai.google.dev/gemini-api/docs/api-key). No .env.local ou no ambiente privado do servidor, configure:

    GEMINI_API_KEY=COLE_A_CHAVE_PRIVADA_AQUI
    GEMINI_REFERENCE_MODEL=gemini-3.8-flash
    VITE_DISABLE_GEMINI=false
    DISABLE_GEMINI=false

Reinicie npm run dev. Os desafios continuam locais. A pergunta, a proposta e os resumos são enviados ao Gemini para avaliar pertinência; a nota continua local. Falhas de chave, cota, rede ou resposta inválida retornam à triagem local. Uma avaliação válida que não aceita obras mantém a lista vazia. IA e trechos literais não substituem a validação acadêmica. Não foi usada uma chave real na revisão: o caminho remoto foi testado com respostas controladas.

## Gemini também para gerar desafios

Além da chave privada, habilite ambas as opções:

    VITE_USE_GEMINI_CHALLENGES=true
    ENABLE_GEMINI_CHALLENGES=true
    GEMINI_CHALLENGE_MODEL=gemini-3.8-flash

O navegador chama /api/challenge, sem receber a chave. O servidor usa os subtemas e instruções originais. Falhas, timeout e respostas malformadas retornam ao banco local.

Não use mais VITE_GEMINI_API_KEY. Se uma chave real tiver sido utilizada em um build publicado anteriormente, o responsável deve revisar seu uso e substituí-la: o código antigo a incorporava ao JavaScript público. Esta revisão não recuperou nem modificou a chave.

## Publicação

O GitHub Pages executa somente arquivos estáticos. Seu workflow agora compila com Gemini desativado, sem consumir o secret existente. O fluxo completo exige hospedar o serviço Node; criar um secret no GitHub não instala esse serviço.

Para testar a versão compilada, use Node 22.9 ou superior e execute:

    npm test
    npm run typecheck
    npm run build
    npm start

Abra http://127.0.0.1:4173/Jogo-ENGIN/. Para consultas reais de diagnóstico, com o servidor de desenvolvimento ativo, execute node scripts/check-references-live.mjs. Ele força Gemini desativado e grava artifacts/review-live.json.

Se a API estiver separada do frontend, configure VITE_RESEARCH_API_URL no frontend e RESEARCH_ALLOWED_ORIGINS no servidor com a origem exata do jogo, sem caminhos. O proxy precisa encaminhar host/protocolo corretamente, ou a origem pública deve constar nessa lista.

Há limites por processo: 90 consultas UFSC e 12 solicitações de modelo por minuto/endereço; 6 buscas UFSC e 2 modelos simultâneos; 200 chamadas Gemini por dia. Origens não permitidas e entradas maiores que 250 kB são rejeitadas. Por padrão, chamadas Gemini de conexões externas são bloqueadas.

ALLOW_REMOTE_GEMINI=true permite conexões externas, mas não autentica jogadores. Um proxy local pode fazer conexões externas parecerem locais. Antes de publicar a API paga, configure autenticação e limites persistentes/compartilhados no gateway. Os controles em memória reiniciam com o processo e não coordenam múltiplas instâncias. CORS não substitui autenticação.

.env.local está ignorado pelo Git. .env.example não tem valores de chaves. Scopus e Web of Science não possuem integração direta; atalhos de pesquisa não comprovam indexação. Google Play continua sendo uma etapa futura.
