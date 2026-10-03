# Parecer da revisão final — Jogo ENGIN

Data: 3 de outubro de 2026. Branch: fix/referencias-cientificas. Base de comparação: 9685c3d. O parecer descreve a revisão anterior ao envio da branch ao GitHub.

**Pronto para teste local com ressalvas acadêmicas. Ainda não pronto para publicação do fluxo completo.** O envio posterior da branch e a abertura de uma proposta de atualização não publicam o jogo. Nenhuma contratação ou mudança de secret foi feita.

## Problemas encontrados e corrigidos

| Gravidade | Problema | Correção e localização |
|---|---|---|
| Alta | A chave de geração Gemini era incorporada ao JavaScript pelo workflow e pelo cliente. | Chamadas movidas para o servidor; workflow não injeta mais a chave. geminiService.ts:596, server/challengePrompt.mjs, server/researchApi.mjs:86 e .github/workflows/deploy.yml:39. Build com duas chaves fictícias não incluiu nenhum marcador. |
| Alta | Coincidências genéricas eram apresentadas como referências pertinentes: institucionalizado equivalia a organização; colaboradores a compartilhamento; retenção de empregados a retenção do conhecimento; integração na economia a integração do conhecimento. | Frases de domínio mais precisas, contexto organizacional delimitado, distinção do objeto da retenção e do foco educacional/técnico. src/services/localReferenceValidation.ts e src/services/researchTopics.ts. Cinco casos reais viraram regressões, incluindo a tese sobre a Namíbia. |
| Alta para API pública | Endpoints aceitavam entradas sem controle de origem, tamanho em bytes, concorrência ou frequência; acesso pago remoto não tinha bloqueio explícito. | Validação de método, origem/CORS, JSON, área, metadados, limites de entrada, frequência e concorrência; teto diário Gemini e bloqueio remoto por padrão. URLs malformadas retornam 400. server/researchApi.mjs. Isso ainda não substitui autenticação e quotas persistentes no gateway. |
| Média | JSON corrompido, armazenamento bloqueado ou cheio podia derrubar a aplicação. | Leitura validada, fallback em memória e aviso quando os resultados não podem ser salvos. App.tsx:1042 e src/services/browserStorage.ts. |
| Média | O código original mostrava pontos, mas não adicionava a rodada ao histórico nem ao ranking. | Persistência do registro e acumulação dos pontos já atribuídos, por jogador e área. App.tsx:1259 e src/services/ranking.ts. Conferido no navegador antes e depois de recarregar. |
| Média | A API OpenAlex retornava M.A. Mitchell, enquanto o registro DOI informa Victoria L. Mitchell. | Conferência adicional de autoria no Crossref para resultados OpenAlex com DOI. src/services/scientificSearchService.ts:188. Falhas mantêm os metadados da fonte sem selo de conferência. |
| Média | Configuração sem Gemini podia reutilizar cache de outro modo; cache malformado e metadados inválidos afetavam a busca. | Chave inclui endpoint e modo, nova versão do cache, validação dos registros. Ausência de fontes externas agora aparece no aviso. src/services/scientificSearchService.ts. |
| Média | Geração remota podia devolver um desafio vazio e não tinha um retorno local robusto para todos os erros. | Esquema, tamanho, timeout, retorno ao banco original e ativação explícita no cliente e servidor. geminiService.ts:596 e server/researchApi.mjs. |
| Baixa | Todos os documentos pareciam artigos e faltava distinguir triagem local da IA. | Interface mostra tipo informado pela fonte, método de triagem e origem do trecho. src/components/ReferenceList.tsx. Atalhos Scopus/ERIC continuam identificados como pesquisa. |

A deduplicação anterior para a obra de integração com dois DOI e erro de grafia passou na regressão. Ela continua heurística para títulos próximos; não equivale a uma conferência bibliográfica completa.

## Pertinência nas quatro áreas

O diagnóstico usou o primeiro desafio real do banco de cada área, sem proposta inventada para favorecer resultados e com Gemini explicitamente desativado. O registro completo está em artifacts/review-live.json; o comando reprodutível é node scripts/check-references-live.mjs. Resultados e disponibilidade dos serviços mudam entre consultas.

| Área e desafio | Selecionadas na última execução | Leitura da amostra |
|---|---:|---|
| Governança — Conhecimento sem Governança | 4, sendo 2 UFSC | Resumos sobre governança de dados/conhecimento, comitê decisório, mecanismos de compartilhamento e rotinas organizacionais. São conexões temáticas plausíveis; aplicações setoriais não provam transferência direta para toda organização. |
| Gestão — Capital Intelectual em Risco | 4, sendo 2 UFSC | As obras UFSC tratam diretamente de retenção em transições de comando e rotatividade. As externas tratam de carreira/retenção e de uma organização de água. Exigem leitura para separar retenção de pessoas da preservação do saber. |
| Integração — Dados Duplicados entre Setores | 2, sendo 1 UFSC | Integração de bases heterogêneas é diretamente relacionada. O artigo de Mitchell aborda capacidade de integração e desempenho de projetos, com relação mais abrangente. O programa informou a insuficiência; não preencheu a terceira posição com curso de MIS ou economia do conhecimento. |
| UCR — Educação Corporativa Desconectada | 4, sendo 3 UFSC | Framework Ponte TAP, maturidade, agente integrador e tecnologias em UCR têm relação temática com aprendizagem em rede. A seleção final para cada resposta depende de conferência acadêmica. |

O falso positivo de Namíbia foi investigado pelo resumo recuperado no OpenAlex: o foco é o impacto do HIV/AIDS na formação e transmissão intergeracional do conhecimento e na governança social. Ele não demonstra o mecanismo organizacional pedido no caso testado. A correção não bloqueia HIV/saúde: um teste positivo mantém pesquisa pertinente sobre retenção do conhecimento em organizações de saúde.

**A meta de pelo menos três obras pertinentes em todo desafio ainda não está demonstrada.** Não há garantia de correspondência científica quase integral sem curadoria e leitura das obras. O sistema faz triagem de resumos, e algumas referências ainda são abrangentes. Recomenda-se Paulo validar uma amostra de desafios e registrar quais obras efetivamente fundamentam cada problema; isso também permitirá medir falsos positivos e ausências de resultados.

Há erros de catálogo nas fontes: por exemplo, uma entrada UFSC informa “Dissertação (Doutorado)” e o OpenAlex classifica como artigo um registro com URN/ISBN. A interface informa que o tipo vem da fonte; a revisão não inventou uma classificação substituta.

## Verificações executadas

- 30 testes automatizados passaram, incluindo casos reais negativos, retorno local, citação inventada, duplicatas, autores, DOI, prioridade UFSC, expansão externa, cache, concorrência, bloqueio remoto, CORS, payload e armazenamento.
- Checagem TypeScript e build passaram. A compilação foi testada com marcadores fictícios de chave pública e privada: nenhum apareceu nos arquivos JavaScript.
- Comparação com 9685c3d preservou exatamente o avaliador, limites, bancos de fontes, banco de desafios, subtemas e instruções de geração. O ranking apenas acumula os pontos que esse avaliador já calculou.
- Consulta real nas quatro áreas: zero chamadas Gemini. Falhas intermitentes do Crossref foram observadas e informadas.
- Navegador em 390 × 844: formulário, carregamento, resultado e referências legíveis, sem conteúdo ultrapassando a largura. Imagem: artifacts/revisao-celular.png. Tamanho original e conexão foram restaurados.
- Falha de rede simulada: avaliação permaneceu disponível, nota de 5 exibida e zero obras com aviso. Imagem: artifacts/revisao-sem-rede.png.
- Versão compilada com servidor Node: página e APIs responderam; tentativa de sair da pasta estática recebeu 403. Rodada de Gestão sem rede gerou 10 pontos, REP(1) e ranking persistente após recarregar. Imagem: artifacts/revisao-ranking.png.
- Bloqueio/corrupção/quota do armazenamento foram simulados nos testes automatizados. O controle de navegador não permitiu injetar o bloqueio em uma página real; essa variante não foi declarada como teste visual.
- Gemini: respostas controladas verificaram sucesso, indisponibilidade, erro de provedor, saída inválida, limite e fallback. **Não houve teste ao vivo com uma chave válida.**
- npm audit --omit=dev: zero vulnerabilidades reportadas. A auditoria completa apontou cinco entradas altas na cadeia de desenvolvimento Tailwind 3 → glob/micromatch/braces. A correção oferecida exige migração principal do Tailwind; ficou registrada, sem alteração automática que pudesse modificar o layout. Esses pacotes não são dependências de produção do servidor.

## Pendências antes de publicar

1. Curadoria acadêmica e avaliação da pertinência por desafio. Decidir com Paulo se teses, dissertações, TCCs, livros e capítulos são aceitos ou se algumas situações exigem artigos revisados por pares. A implementação atual usa obras acadêmicas de vários tipos.
2. Configurar e testar a chave privada Gemini se esse caminho for adotado. Se a chave antiga foi usada em build público, o responsável deve revisar seu uso e substituí-la. Seguir docs/CONFIGURAR_GEMINI.md; não utilizar mais VITE_GEMINI_API_KEY.
3. Hospedar o serviço Node: GitHub Pages sozinho não executa a consulta UFSC nem Gemini. Para uma API paga pública, preparar autenticação, quotas persistentes/compartilhadas e origem/proxy corretos. CORS e limites em memória não resolvem abuso por clientes autenticados ou múltiplas instâncias.
4. Planejar a atualização da cadeia de desenvolvimento Tailwind afetada pela auditoria. Registrar a avaliação de exposição: os padrões de arquivo atuais vêm do projeto, não dos jogadores; o problema reportado é negação de serviço no processamento de padrões.
5. Publicação Google Play é uma etapa separada. Scopus e Web of Science continuam sem acesso direto por API; links externos são somente atalhos de busca.

Fontes técnicas consultadas: [segurança de chaves Gemini](https://ai.google.dev/gemini-api/docs/api-key), [modelo configurado](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash), [registro DOI de Mitchell](https://api.crossref.org/works/10.2307%2F25148759), [registro da tese de Namíbia](https://bradscholars.brad.ac.uk/entities/publication/2b1cdcc8-8177-485a-9ae1-15e43b357c5f) e [aviso de segurança braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
