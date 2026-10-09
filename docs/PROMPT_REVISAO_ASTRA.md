# Prompt para a revisão final com GPT-6 Astra

Selecione GPT-6 Astra no Codex e use este prompt na pasta do projeto, na branch fix/referencias-cientificas. Confira tanto o histórico dessa branch quanto eventuais alterações locais posteriores; a main pode ainda conter a versão anterior.

---

Faça a revisão final e corrija problemas reais no projeto Jogo-ENGIN, em `C:\Codex\projects\Jogo Paulo`, branch `fix/referencias-cientificas`. Revise o código atual da pasta, incluindo alterações não commitadas e arquivos novos. O repositório remoto é https://github.com/paulormoura1/Jogo-ENGIN; o ponto de partida da revisão é o commit 9685c3d.

O objetivo é apresentar pelo menos três obras acadêmicas pertinentes ao desafio nas quatro áreas, com autores e links reais, priorizando o repositório UFSC e ampliando para fontes abertas quando faltarem resultados. Três é uma meta, não autorização para inserir obras irrelevantes. A calibração do avaliador, os limites das notas e o banco de desafios do Paulo devem ser preservados. A quarta área ainda está sendo calibrada por ele.

Confira especialmente:

- Funcionamento completo sem chaves Gemini e com o Gemini explicitamente desativado. Os desafios locais, a avaliação e a busca de referências devem continuar utilizáveis; indisponibilidades das fontes precisam ser informadas.
- Qualidade da seleção pelos resumos: artigos que só compartilham palavras genéricas, contextos incompatíveis, documentos sem resumo, trechos fora de contexto e limites da triagem local. Similaridade e nota do modelo não comprovam sustentação científica. Avalie também se a proposta ajuda na ordenação sem desviar a busca do desafio.
- Prioridade real da UFSC, ampliação para OpenAlex/Crossref, duplicatas, retratações quando identificáveis, autores, DOI, links e distinção entre obra recuperada e mero atalho de pesquisa. Verifique a classificação das obras: o repositório também contém teses, dissertações e outros documentos.
- Caminho opcional com Gemini: validação de respostas, citações realmente presentes nos resumos, erros, cotas, timeouts e retorno ao modo local. Teste sem consumir serviços pagos se não houver uma chave explicitamente disponibilizada para isso; use respostas controladas e informe o que não foi verificado ao vivo.
- Erros de execução, concorrência, cache, armazenamento indisponível, cancelamento, desempenho e estado da interface. Confira a tela em tamanho de celular.
- Segurança do serviço de referências, exposição de chaves, limites de requisição, CORS, abuso dos endpoints e prontidão para hospedagem. O GitHub Pages não executa o backend Node, e o Google Play ainda não recebeu um aplicativo publicado.
- Consistência de `.env.example`, `docs/CONFIGURAR_GEMINI.md`, `docs/REFERENCIAS.md`, scripts, dependências, workflow de publicação e testes. A existência do secret GitHub `VITE_GEMINI_API_KEY` foi confirmada, mas seu valor e validade não foram verificados; não tente imprimi-lo.

Execute os testes, a checagem de tipos e o build relevantes. Teste pelo menos um desafio real de cada área e estados de falha; verifique se as obras selecionadas são pertinentes, não apenas se o contador chegou a três. Use os resultados para procurar regressões que os testes atuais não detectam.

Há um caso concreto a investigar: numa consulta de Governança sobre retenção e compartilhamento entre equipes, a triagem local admitiu a obra “Impact of HIV and AIDS on intergenerational knowledge formation, retention and transfer and its implication for both sectoral and summative, governances in Namibia.” Verifique seu contexto e sua pertinência à pergunta; o cruzamento de termos não basta para aceitá-la. Não esconda essa limitação nem crie uma exclusão arbitrária baseada somente nesse título. Em Integração, havia dois registros de “Knowledge Integration and Information Technology Project Performance”, com DOI distintos e um erro de grafia; a deduplicação foi ajustada e precisa ser conferida com outras obras.

Corrija autonomamente defeitos confirmados dentro desse escopo e adicione testes úteis para as correções. Não altere notas, desafios, publique, faça push, modifique secrets ou contrate serviços. Se uma mudança necessária afetar a calibração ou depender de decisão acadêmica, explique o problema e deixe essa decisão destacada para o responsável.

Entregue um parecer curto com: problemas encontrados por gravidade e localização, correções feitas, verificações executadas, limitações e pendências. Diga claramente se está pronto para teste local, se as referências ainda exigem validação acadêmica e o que impede uma publicação real. Não declare que está tudo certo quando houver partes não verificadas.
