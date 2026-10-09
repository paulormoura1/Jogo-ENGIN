const SUBTHEMES = {
"Governança do Conhecimento": [
  "Auditoria do conhecimento",
  "Governança para inovação",
  "Maturidade em GC",
  "Processos de conhecimento",
  "Mecanismos de governança",
  "Estruturas de governança",
  "Avaliação e monitoramento",
  "Compartilhamento do conhecimento",
  "Transferência do conhecimento",
  "Criação do conhecimento",
  "Retenção do conhecimento",
  "Integração do conhecimento",
  "Políticas de gestão do conhecimento",
  "Coordenação entre áreas",
  "Responsabilidade e eficiência",
  "Transparência",
],
"Gestão do Conhecimento": [
  "Gestão do conhecimento",
  "Capital intelectual",
  "Aprendizagem organizacional",
  "Tomada de decisão",
  "Criação de conhecimento",
  "Compartilhamento de conhecimento",
  "Memória organizacional",
  "Lições aprendidas",
  "Comunidades de prática",
  "Transferência do conhecimento",
  "Reutilização do conhecimento",
  "Conhecimento tácito",
  "Conhecimento explícito",
  "Retenção do conhecimento",
  "Registro do conhecimento",
  "Gestão de mudanças",
],
"Engenharia da Integração": [
  "Engenharia da integração",
  "Integração organizacional",
  "Integração entre áreas",
  "Integração entre setores",
  "Integração de processos",
  "Integração de sistemas",
  "Processos integrados",
  "Sistemas integrados",
  "Sistemas complexos",
  "Ecossistemas de inovação",
  "Modelagem sistêmica",
  "Arquitetura organizacional",
  "Arquitetura de integração",
  "Interoperabilidade",
  "Fluxo de informação",
  "Compartilhamento do conhecimento",
  "Conhecimento crítico",
  "Coordenação entre equipes",
  "Conexão entre setores",
  "Rede de aprendizagem",
  "Aprendizagem em rede",
  "Comunidades de prática",
  "Ambientes colaborativos",
  "Colaboração entre equipes",
  "Transferência do conhecimento",
  "Memória organizacional",
  "Aprendizagem organizacional",
  "Reutilização do conhecimento",
  "Integração do conhecimento",
],
  "Universidade Corporativa em Rede": [
  "Universidade corporativa",
  "Universidade em rede",
  "Educação corporativa",
  "Aprendizagem em rede",
  "Aprendizagem organizacional",
  "Competências organizacionais",
  "Inovação educacional",
  "Governança em rede",
  "Integração entre unidades",
  "Compartilhamento do conhecimento",
  "Trilhas de aprendizagem",
  "Comunidades de prática",
  "Rede de aprendizagem",
  "Ecossistema de aprendizagem",
  "Gestão do conhecimento",
  "Colaboração entre equipes",
  "Retenção do conhecimento",
  "Transferência do conhecimento",
  "Memória organizacional",
  "Capital intelectual",
  "Desenvolvimento de competências",
  "Desenvolvimento profissional",
  "Capacitação contínua",
  "Educação continuada",
  "Trajetórias de aprendizagem",
  "Desenvolvimento contínuo",
],
};

export const researchAreas = Object.keys(SUBTHEMES);
export function challengePrompt(area) {
  const subthemes = SUBTHEMES[area].join(", ");
  const instruction = `
Crie um desafio curto, realista e impactante para a área: "${area}".
Subtemas possíveis: ${subthemes}.

REGRAS CRÍTICAS:
1. Use o TEMPO PRESENTE.
   Exemplos:
   - "A organização enfrenta..."
   - "A equipe apresenta..."
   - "O sistema demonstra..."
   - "A empresa sofre..."

2. Seja CONCISO.
   O desafio completo deve ter no máximo 4 frases curtas.

3. Apresente uma situação-problema realista relacionada à área e aos subtemas informados.

4. NÃO apresente a solução.

5. A descrição deve obrigatoriamente terminar com uma MISSÃO CLARA para o jogador.

6. Essa missão deve exigir decisão, aplicação ou proposição de solução.
   Use perguntas como:
   - "Como especialista, o que você faria para enfrentar essa situação?"
   - "Que solução você implantaria e como ela seria aplicada?"
   - "Que estratégia você adotaria para resolver esse problema?"
   - "Como você estruturaria uma intervenção para melhorar essa situação?"
   - "Que ações você recomendaria e por quê?"

7. A pergunta final deve estar diretamente relacionada ao problema apresentado e à área "${area}".

8. Evite perguntas genéricas como:
   - "O que você acha?"
   - "Qual sua opinião?"
   - "O que faria?"
   sem explicar o contexto da decisão.

9. A missão deve estimular o jogador a explicar:
   - o que faria;
   - como aplicaria;
   - e por que essa solução seria adequada.

10. Não use linguagem excessivamente acadêmica ou complexa.
    O texto deve ser claro, aplicado e compatível com um jogo de tomada de decisão.

Retorne SOMENTE JSON válido neste formato:

{
  "title": "título curto do desafio",
  "description": "situação-problema + missão clara para o jogador"
}
`;
  return instruction;
}
