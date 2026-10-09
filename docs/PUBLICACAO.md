# Versão para jogar pelo GitHub Pages — 09/10/2026

## Para Paulo

Abra https://paulormoura1.github.io/Jogo-ENGIN/, informe seu nome, toque em ADD e em Iniciar operação. Escolha uma das quatro áreas e responda ao desafio. Não é preciso instalar nada nem configurar uma chave.

Ao avaliar as sugestões, anote a área, o título do desafio e a obra que apareceu. Um print da pergunta e outro das referências ajudam a reproduzir o caso. As notas e os desafios originais foram preservados. As obras sugeridas ainda precisam de conferência acadêmica; a lista pode ter menos de três resultados.

## Como esta publicação funciona

- O workflow compila com `VITE_STATIC_REFERENCES=true` e `VITE_DISABLE_GEMINI=true`. Não faz chamadas a Gemini ou a endpoints `/api` durante a partida.
- O catálogo `public/ufsc-catalog.json` contém oito obras da UFSC recuperadas em 03/10/2026, com título, autores, resumo, link e tipo informado pelo repositório. É um conjunto inicial de candidatos, não uma lista previamente aprovada para qualquer desafio.
- As mesmas regras de seleção por desafio são reaplicadas ao catálogo a cada consulta. Obras inadequadas não devem completar uma contagem mínima. OpenAlex e Crossref continuam sendo consultados pela internet quando faltam resultados.
- Em 09/10/2026, a UFSC devolveu uma página de verificação de acesso em vez dos resultados. Não foi contornada a proteção. O catálogo preserva a data original e a interface exibe essa data. Abrir uma obra também pode exigir a verificação da UFSC.
- A atualização manual é `npm run catalog:update`, executada na raiz. O script consulta os temas dos desafios originais; se uma consulta falhar ou uma área ficar vazia, não sobrescreve o catálogo. Depois de uma coleta bem-sucedida, revise os dados e envie o arquivo atualizado em um commit. Não há atualização agendada.
- O catálogo é público, contém metadados e resumos acadêmicos já recuperados, sem dados de jogadores ou chaves. Pontuação, histórico e classificação permanecem locais ao navegador.
- Gemini e consulta ao vivo da UFSC permanecem opcionais para uma hospedagem com servidor. O responsável pelo jogo não precisa configurar esse modo para usar esta publicação.

## Verificações desta atualização

36 testes automatizados e TypeScript passaram. A comparação com `9685c3d` continua garantindo que avaliador, limites por área, fontes de calibração, banco de desafios e instruções originais foram preservados. O build do Pages passou e a auditoria de dependências de produção não reportou vulnerabilidades.

No navegador em 390 × 844, uma partida de Governança concluiu com 5 pontos e duas leituras, sem erros de JavaScript nem conteúdo ultrapassando a largura. O título do resultado passou a exibir espaços em vez de sublinhados, sem alterar o cálculo. Uma sugestão externa sobre governança para sustentabilidade é abrangente: sua utilidade para o desafio específico de permissões de acesso ainda precisa ser avaliada por Paulo.

Depois da publicação inicial, uma partida de Gestão revelou que o desafio "Equipes que Resolvem o Mesmo Problema" não ativava nenhum tema do filtro e admitia obras genéricas da área. Foi acrescentado o tema de reutilização/retrabalho; problemas sem tema reconhecido agora não recebem sugestões apenas por coincidência de área. O cache foi invalidado. O caso ganhou regressão e uma nova consulta real (`artifacts/reutilizacao-live.json`): as quatro sugestões passaram a conter discussão de reutilização de conhecimento ou retrabalho. O vínculo específico com a proposta continua pendente de validação acadêmica.

O teste de consultas reais em `artifacts/publicacao-live.json` usa o catálogo estático, os primeiros desafios das quatro áreas e zero chamadas Gemini. Encontrou 4, 4, 2 e 4 obras, respectivamente. Houve indisponibilidade parcial do Crossref, comunicada ao jogador. Os resultados não constituem validação acadêmica, nem cobertura de todos os desafios.

Permanecem as limitações acadêmicas e de dependências de desenvolvimento do parecer de 03/10 em `REVISAO_FINAL.md`. A necessidade de servidor nesse parecer se refere ao fluxo de UFSC ao vivo e Gemini; a versão para avaliação pelo Pages usa o catálogo descrito acima.

## Voltar à versão anterior

A publicação é feita ao integrar o PR #1 à `main`. Prefira um merge normal, preservando os commits. Para reverter todo o PR sem apagar o histórico, em uma cópia sem alterações locais:

```text
git switch main
git pull --ff-only origin main
git log --oneline --merges -10
git revert -m 1 HASH_DO_MERGE_DO_PR_1
git push origin main
```

Substitua `HASH_DO_MERGE_DO_PR_1` pelo commit que integra o PR #1 (veja o link do merge no GitHub). O comando cria um novo commit desfazendo o PR; o workflow publica a reversão. Se surgirem conflitos, `git revert --abort` cancela a tentativa. Se a branch exigir revisão, envie a reversão por outro PR. Não use `reset --hard` ou push forçado.

O merge do PR #1 é `234dcec16b974d37815f14e9c7461312193f3c9b`. Caso existam correções posteriores, reverta primeiro os merges dessas correções, do mais recente ao mais antigo, antes de reverter o PR #1. Confira `git log --oneline --merges` e o conteúdo de cada PR para preservar alterações de outras pessoas.

O commit `9685c3d` identifica a base original, não é o commit a passar para `git revert`. Depois de novas alterações de Paulo, revise eventuais conflitos para não desfazer trabalho posterior.
