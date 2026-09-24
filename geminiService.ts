import { getSourcesByArea, searchSources } from "./src/services/sourcesService";
import { GoogleGenAI } from "@google/genai";
import { ResearchArea, GameState } from "./src/tipos";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY não definida no build (GitHub Actions).");
}

const ai = new GoogleGenAI({ apiKey });

const SUBTHEMES: Record<ResearchArea, string[]> = {
[ResearchArea.GOVERNANCE_KNOWLEDGE]: [
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
[ResearchArea.KNOWLEDGE_MGMT]: [
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
[ResearchArea.INTEGRATION_ENG]: [
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
  [ResearchArea.UCR]: [
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
const FALLBACK_CHALLENGES: Record<
  ResearchArea,
  { title: string; description: string }[]
> = {
  [ResearchArea.GOVERNANCE_KNOWLEDGE]: [
  {
    title: "Conhecimento sem Governança",
    description:
      "A organização possui informações estratégicas distribuídas entre diferentes setores, mas não existem responsabilidades claramente definidas sobre sua gestão e utilização. Decisões importantes são tomadas sem critérios consistentes de acesso, registro e compartilhamento do conhecimento. Como especialista, que estrutura de governança você implantaria, como ela funcionaria e por que seria adequada para essa situação?",
  },
  {
    title: "Baixa Maturidade em Gestão do Conhecimento",
    description:
      "A organização desenvolve iniciativas isoladas de gestão do conhecimento, porém não possui mecanismos para avaliar sua maturidade nem acompanhar seus resultados. A direção pretende transformar essas iniciativas em práticas institucionais permanentes. Que estratégia você adotaria para avaliar a maturidade em GC e orientar essa evolução organizacional?",
  },
  {
    title: "Decisões sem Conhecimento Integrado",
    description:
      "Gestores de diferentes setores utilizam informações e critérios distintos para tomar decisões, dificultando a coordenação institucional e o aprendizado organizacional. Conhecimentos relevantes existem, mas não chegam de forma estruturada aos responsáveis pelas decisões. Como você estruturaria uma intervenção de governança do conhecimento para melhorar esse processo e por quê?",
  },
  {
    title: "Governança para Inovação",
    description:
      "A organização deseja ampliar sua capacidade de inovação, mas ideias, experiências e conhecimentos permanecem dispersos entre equipes e projetos. Não há uma estrutura clara para transformar esse conhecimento em subsídio às decisões estratégicas. Que mecanismos de governança do conhecimento você implantaria para apoiar a inovação e como eles seriam aplicados?",
  },
    {
  title: "Conhecimento Crítico no Laboratório",
  description:
    "Um laboratório de pesquisa depende da experiência de poucos pesquisadores para executar procedimentos essenciais. Parte desse conhecimento nunca foi formalmente registrada e dois desses profissionais deixarão o projeto nos próximos meses. Como você estruturaria uma intervenção para reduzir esse risco e garantir a continuidade das atividades?",
},
{
  title: "Resultados que Ninguém Acompanha",
  description:
    "Um laboratório implantou diversas iniciativas para melhorar a circulação e o uso do conhecimento, mas não possui critérios para verificar se essas ações estão produzindo resultados. A coordenação precisa decidir quais iniciativas devem continuar ou ser revistas. Como você estruturaria esse acompanhamento e como utilizaria seus resultados?",
},
{
  title: "Informação Restrita entre Pesquisadores",
  description:
    "Diferentes equipes de um centro de pesquisa produzem dados e aprendizados relevantes, porém cada grupo mantém suas informações internamente. Outros pesquisadores frequentemente descobrem tarde demais que determinado conhecimento já existia. Que intervenção você adotaria para modificar essa situação e como ela funcionaria?",
},
{
  title: "Decisões sem Responsáveis Definidos",
  description:
    "Em um projeto multidisciplinar, decisões relacionadas ao uso, registro e disponibilização de conhecimentos são tomadas informalmente. Quando surgem problemas, não está claro quem deveria decidir ou responder por eles. Como você reorganizaria esse processo e por que sua proposta seria adequada?",
},
{
  title: "Pesquisa sem Memória",
  description:
    "Um laboratório conclui vários projetos todos os anos, mas os aprendizados, dificuldades e soluções desenvolvidos pelas equipes raramente permanecem disponíveis após o encerramento das pesquisas. Novos projetos acabam enfrentando problemas semelhantes. Como você enfrentaria essa situação?",
},
{
  title: "Conhecimento entre Laboratórios",
  description:
    "Dois laboratórios da mesma universidade pesquisam temas complementares, mas trabalham de forma independente e quase não utilizam os conhecimentos produzidos um pelo outro. A universidade pretende aproximar essas equipes sem retirar sua autonomia científica. Que estratégia você adotaria e como ela funcionaria?",
},
{
  title: "Acesso Desigual à Informação",
  description:
    "Em uma instituição, algumas equipes têm acesso rápido a informações importantes para suas atividades, enquanto outras dependem de contatos pessoais para obtê-las. Essa diferença começa a prejudicar decisões e projetos conjuntos. Como você estruturaria uma intervenção para tornar esse processo mais adequado?",
},
{
  title: "Conhecimento sem Diretrizes",
  description:
    "Uma universidade possui diversas iniciativas para registrar, compartilhar e utilizar conhecimentos, porém cada unidade estabelece suas próprias práticas. A ausência de orientações institucionais provoca diferenças significativas entre setores. Como você organizaria essa situação sem eliminar a autonomia das unidades?",
},
{
  title: "Experiência que Sai com o Pesquisador",
  description:
    "Um pesquisador responsável por técnicas essenciais de um laboratório está encerrando seu vínculo com a instituição. Outros integrantes conhecem apenas partes dos procedimentos que ele executa. Que estratégia você adotaria antes de sua saída e como garantiria que esse conhecimento continuasse disponível?",
},
{
  title: "Setores que Não Conversam",
  description:
    "Uma universidade possui setores que produzem conhecimentos relevantes para os mesmos projetos, mas cada unidade trabalha com prioridades e rotinas próprias. Essa fragmentação dificulta ações conjuntas e provoca retrabalho. Como você estruturaria uma intervenção para melhorar a atuação entre essas áreas?",
},
{
  title: "Conhecimento para Decidir",
  description:
    "A direção de um centro de pesquisa precisa decidir quais projetos receberão novos recursos, mas as informações sobre resultados, competências das equipes e conhecimentos produzidos estão dispersas. Como você organizaria esse processo para apoiar decisões mais consistentes?",
},
{
  title: "Boas Práticas que Não se Espalham",
  description:
    "Uma equipe desenvolveu uma forma mais eficiente de executar determinada atividade e obteve bons resultados, mas outras unidades continuam utilizando procedimentos antigos porque desconhecem essa experiência. Como você faria esse aprendizado alcançar e ser utilizado pelas demais equipes?",
},
{
  title: "Crescimento sem Coordenação",
  description:
    "Um laboratório cresceu rapidamente e passou a reunir pesquisadores, bolsistas e técnicos em diferentes projetos. Com o aumento da equipe, informações importantes deixaram de circular adequadamente e responsabilidades começaram a se sobrepor. Como você reorganizaria essa dinâmica?",
},
{
  title: "Conhecimento para Novos Integrantes",
  description:
    "Novos pesquisadores ingressam frequentemente em um grupo de pesquisa, mas dependem dos integrantes mais antigos para compreender procedimentos, decisões anteriores e práticas do laboratório. Quando essas pessoas não estão disponíveis, a aprendizagem fica comprometida. Como você estruturaria uma solução para esse problema?",
},
{
  title: "Projetos Repetindo os Mesmos Erros",
  description:
    "Equipes de pesquisa registram relatórios ao final dos projetos, mas dificuldades e soluções encontradas durante a execução raramente são consideradas nas iniciativas seguintes. Como você estruturaria um processo para que essas experiências contribuíssem efetivamente para novos projetos?",
},
{
  title: "Parceria sem Fluxo de Conhecimento",
  description:
    "Uma universidade e uma organização parceira desenvolvem conjuntamente um projeto de inovação, porém os conhecimentos produzidos permanecem concentrados nas equipes que os originaram. Isso começa a dificultar decisões conjuntas. Que estrutura você adotaria para melhorar essa relação?",
},
{
  title: "Muitas Informações, Pouca Clareza",
  description:
    "Um centro de pesquisa produz grande quantidade de documentos, relatórios e dados, mas pesquisadores e gestores têm dificuldade para identificar quais informações são relevantes e quem é responsável por mantê-las atualizadas. Como você organizaria esse ambiente?",
},
{
  title: "Inovação Dependente de Poucas Pessoas",
  description:
    "As principais ideias de inovação de uma organização surgem de um pequeno grupo de especialistas. Quando esses profissionais não participam dos projetos, as equipes encontram dificuldade para avançar. Como você reduziria essa dependência preservando e ampliando a capacidade de inovação?",
},
{
  title: "Práticas Diferentes entre Unidades",
  description:
    "Diferentes unidades de uma instituição registram e compartilham conhecimento de maneiras distintas. Algumas possuem práticas consolidadas, enquanto outras dependem quase exclusivamente de comunicação informal. Como você conduziria uma evolução institucional sem impor uma solução única a todas as unidades?",
},
{
  title: "Conhecimento sem Critério de Acesso",
  description:
    "Uma organização ampliou seus repositórios internos, mas não definiu claramente quais informações devem ser abertas, restritas ou disponibilizadas a determinados grupos. A situação gera tanto dificuldade de acesso quanto preocupação com informações sensíveis. Como você estruturaria esse processo?",
},
{
  title: "Aprendizado Perdido entre Projetos",
  description:
    "Pesquisadores participam sucessivamente de diferentes projetos e acumulam experiências importantes, porém esse aprendizado permanece associado às pessoas e raramente é incorporado às práticas do laboratório. Que intervenção você proporia para transformar essas experiências em conhecimento útil para a organização?",
},
{
  title: "Decisão Estratégica Fragmentada",
  description:
    "Gestores responsáveis por uma decisão estratégica recebem informações produzidas por diferentes áreas, mas os dados chegam em formatos, momentos e níveis de detalhamento distintos. Isso dificulta a construção de uma visão comum do problema. Como você estruturaria esse processo?",
},
{
  title: "Conhecimento sem Dono",
  description:
    "Um centro de inovação possui bases, documentos e práticas de compartilhamento, mas ninguém sabe claramente quem deve manter determinados conteúdos atualizados, validar informações ou decidir sobre sua utilização. Como você resolveria essa indefinição?",
},
{
  title: "Integração de Conhecimento Multidisciplinar",
  description:
    "Um projeto reúne pesquisadores de diferentes áreas científicas. Cada equipe domina uma parte importante do problema, mas utiliza conceitos, métodos e informações próprios, dificultando a construção de soluções conjuntas. Como você estruturaria a integração desses conhecimentos?",
},
{
  title: "Transparência em Projeto Institucional",
  description:
    "Um grande projeto institucional envolve diferentes equipes, mas decisões e alterações importantes nem sempre são conhecidas por todos os participantes. Isso provoca dúvidas, retrabalho e interpretações diferentes sobre as prioridades do projeto. Como você melhoraria essa situação?",
},
{
  title: "Governança Após o Encerramento do Projeto",
  description:
    "Um projeto de pesquisa de longa duração está chegando ao fim e produziu dados, métodos, decisões, experiências e conhecimentos relevantes. A instituição pretende preservar esse patrimônio para futuras pesquisas, mas ainda não definiu responsabilidades nem procedimentos para sua continuidade. Que estratégia você adotaria?",
},
],
 [ResearchArea.KNOWLEDGE_MGMT]: [
  {
    title: "Capital Intelectual em Risco",
    description:
      "A organização depende fortemente do conhecimento de profissionais experientes, mas parte desse conhecimento não está registrada nem compartilhada com as equipes. A saída de pessoas-chave começa a comprometer processos e resultados. Como especialista, que solução de gestão do conhecimento você implantaria para preservar e desenvolver esse capital intelectual, como ela funcionaria e por quê?",
  },
  {
    title: "Conhecimento que Não Circula",
    description:
      "As equipes acumulam experiências e conhecimentos relevantes durante os projetos, porém esse aprendizado permanece restrito aos grupos que participaram das atividades. Outros setores repetem erros e desenvolvem soluções que já existem internamente. Que estratégia você adotaria para ampliar o compartilhamento e a reutilização do conhecimento na organização?",
  },
  {
    title: "Planejamento sem Colaboração",
    description:
      "Os setores realizam seus planejamentos de forma isolada e utilizam pouco o conhecimento produzido por outras equipes. Como consequência, surgem atividades duplicadas, decisões desconectadas e baixa aprendizagem entre as áreas. Como você estruturaria um processo colaborativo de gestão do conhecimento para melhorar esse planejamento?",
  },
  {
    title: "Conhecimento em Processo de Mudança",
    description:
      "A organização está implantando novos processos e tecnologias, mas parte dos profissionais mantém práticas anteriores e encontra dificuldades para incorporar novos conhecimentos ao trabalho. A mudança começa a perder consistência entre os setores. Que ações de gestão do conhecimento você adotaria para apoiar essa transformação e por que seriam adequadas?",
  },
   {
  title: "Especialista Prestes a Sair",
  description:
    "Um pesquisador experiente domina procedimentos essenciais de um laboratório e está próximo de deixar a instituição. Grande parte do que ele sabe foi adquirida pela experiência e não está documentada. Como você evitaria que esse conhecimento fosse perdido e como prepararia a equipe para continuar as atividades?",
},
{
  title: "Projetos Repetem os Mesmos Erros",
  description:
    "Um laboratório desenvolve vários projetos ao longo do ano, mas problemas já resolvidos voltam a ocorrer em novas pesquisas. As equipes reconhecem que experiências anteriores poderiam ajudar, porém quase nunca conseguem recuperá-las. Que solução você adotaria para mudar essa situação?",
},
{
  title: "Conhecimento Preso na Experiência",
  description:
    "Profissionais experientes resolvem rapidamente problemas técnicos porque acumularam conhecimento ao longo dos anos, mas têm dificuldade para explicar tudo o que fazem aos integrantes mais novos. Como você faria esse conhecimento chegar às demais pessoas da organização?",
},
{
  title: "Documentos que Ninguém Encontra",
  description:
    "A organização possui muitos relatórios, manuais e registros de projetos, mas os profissionais gastam tempo procurando informações e frequentemente produzem novamente conteúdos que já existem. Como você organizaria esse conhecimento para facilitar seu uso no trabalho?",
},
{
  title: "Aprendizado Depois do Projeto",
  description:
    "Ao concluir seus projetos, as equipes apresentam os resultados, mas raramente discutem o que funcionou, o que deu errado e o que deveria ser feito de forma diferente. Pouco desse aprendizado chega aos projetos seguintes. Como você estruturaria uma solução para aproveitar essas experiências?",
},
{
  title: "Equipes que Resolvem o Mesmo Problema",
  description:
    "Duas equipes trabalham separadamente e desenvolvem soluções semelhantes para problemas que já haviam sido resolvidos internamente. Elas só descobrem a duplicidade quando os projetos estão praticamente concluídos. Como você reduziria esse retrabalho utilizando o conhecimento existente na organização?",
},
{
  title: "Laboratório Dependente de Pessoas",
  description:
    "Determinadas atividades de um laboratório só podem ser realizadas quando alguns profissionais específicos estão presentes. Os procedimentos existem parcialmente em documentos, mas detalhes importantes permanecem na experiência dessas pessoas. Que estratégia você adotaria para diminuir essa dependência?",
},
{
  title: "Experiências que Não Viram Aprendizado",
  description:
    "Uma organização executa muitos projetos e acumula experiências importantes, porém continua tomando decisões sem consultar o que aprendeu anteriormente. Como você transformaria essas experiências em conhecimento que possa apoiar decisões futuras?",
},
{
  title: "Novos Integrantes Começam do Zero",
  description:
    "Sempre que novos pesquisadores entram em uma equipe, precisam descobrir informalmente como os processos funcionam, quem possui determinadas informações e quais soluções já foram testadas. Isso aumenta o tempo de adaptação. Como você melhoraria esse processo?",
},
{
  title: "Soluções Esquecidas no Repositório",
  description:
    "A instituição registra resultados e soluções desenvolvidas em projetos, mas os profissionais raramente consultam esse material quando enfrentam novos problemas. Como você faria o conhecimento já produzido voltar a ser utilizado pelas equipes?",
},
{
  title: "Conhecimento entre Pesquisadores",
  description:
    "Pesquisadores de diferentes projetos possuem experiências que poderiam ajudar uns aos outros, mas quase não existem oportunidades para discutir problemas, práticas e soluções. Que iniciativa você implantaria para estimular essa aprendizagem conjunta e como ela funcionaria?",
},
{
  title: "Conhecimento que Sai com a Equipe",
  description:
    "Uma equipe responsável por uma atividade estratégica será substituída nos próximos meses. Os novos profissionais receberão documentos básicos, mas grande parte das decisões e experiências acumuladas nunca foi registrada. Como você prepararia essa transição?",
},
{
  title: "Decisão sem Experiência Acumulada",
  description:
    "Gestores precisam decidir como enfrentar um problema que já ocorreu em outros projetos da organização, mas desconhecem as soluções utilizadas anteriormente e seus resultados. Como você utilizaria o conhecimento existente para apoiar essa decisão?",
},
{
  title: "Boas Ideias que Ficam Isoladas",
  description:
    "Uma equipe desenvolve práticas eficientes e novas soluções durante suas atividades, mas essas ideias permanecem conhecidas apenas pelos integrantes do próprio grupo. Como você faria esse conhecimento contribuir para outras equipes e projetos?",
},
{
  title: "Conhecimento Prático sem Registro",
  description:
    "Técnicos de um laboratório desenvolveram maneiras próprias de executar atividades complexas com eficiência, porém essas práticas não aparecem nos procedimentos oficiais. A instituição teme perder esse conhecimento ao longo do tempo. Como você enfrentaria esse problema?",
},
{
  title: "Base de Conhecimento Desatualizada",
  description:
    "A organização possui uma base interna com documentos e orientações, mas parte do conteúdo está desatualizada e os profissionais deixaram de confiar nas informações disponíveis. Como você recuperaria a utilidade desse conhecimento para as equipes?",
},
{
  title: "Aprender com Erros e Acertos",
  description:
    "Um projeto importante termina com bons resultados, embora tenha enfrentado diversos problemas durante sua execução. A equipe seguinte iniciará uma atividade semelhante. Como você faria os erros, acertos e soluções do primeiro projeto contribuírem para o próximo?",
},
{
  title: "Conhecimento entre Gerações",
  description:
    "Um laboratório reúne pesquisadores experientes e estudantes recém-chegados, mas a troca de conhecimento ocorre apenas quando surgem dúvidas específicas. A coordenação pretende aproveitar melhor essa diversidade de experiências. Que estratégia você adotaria?",
},
{
  title: "Informação Existe, Conhecimento Não é Usado",
  description:
    "A organização possui grande quantidade de documentos e dados, mas os profissionais continuam dependendo de colegas mais experientes para resolver problemas cotidianos. Como você transformaria os recursos existentes em conhecimento efetivamente utilizado pelas equipes?",
},
{
  title: "Mudança sem Aprendizagem",
  description:
    "Uma instituição altera seus processos depois de identificar falhas importantes, mas alguns meses depois as equipes começam a repetir práticas antigas. Como você faria o aprendizado obtido com a mudança permanecer incorporado ao trabalho?",
},
{
  title: "Conhecimento para Resolver Problemas",
  description:
    "Uma equipe enfrenta um problema técnico e começa imediatamente a desenvolver uma nova solução, embora situações semelhantes já tenham ocorrido em outros setores. Como você estruturaria uma forma de localizar e aproveitar esse conhecimento antes de iniciar novamente o trabalho?",
},
{
  title: "Experiência dos Profissionais",
  description:
    "Profissionais acumulam conhecimentos importantes ao executar suas atividades diariamente, mas a organização conhece pouco sobre o que cada pessoa sabe e quais conhecimentos são mais relevantes para seus processos. Como você identificaria e aproveitaria melhor esse conhecimento?",
},
{
  title: "Aprendizagem entre Projetos",
  description:
    "Projetos de uma mesma instituição são conduzidos por equipes diferentes e raramente trocam experiências durante sua execução. Como consequência, soluções úteis permanecem isoladas e erros semelhantes aparecem em vários projetos. Como você estimularia a aprendizagem entre essas equipes?",
},
{
  title: "Conhecimento Espalhado em Diferentes Lugares",
  description:
    "Informações importantes estão distribuídas entre documentos, sistemas, mensagens e arquivos pessoais dos profissionais. Quando alguém precisa resolver um problema, não sabe onde procurar nem se a informação mais atual está disponível. Como você organizaria esse conhecimento?",
},
{
  title: "Equipe Experiente sem Sucessores",
  description:
    "Um setor possui profissionais com muitos anos de experiência, mas quase não prepara outros integrantes para assumir suas atividades. A direção percebe que futuras saídas podem comprometer processos importantes. Que estratégia de gestão do conhecimento você adotaria?",
},
{
  title: "Conhecimento que Precisa Virar Prática",
  description:
    "Após uma capacitação, os profissionais demonstram compreender novos métodos, mas poucos conseguem incorporá-los às atividades cotidianas. Com o tempo, parte da equipe retorna às práticas anteriores. Como você faria esse novo conhecimento ser aplicado e mantido no trabalho?",
},
{
  title: "Dados Duplicados entre Setores",
  description:
    "Dois setores utilizam sistemas diferentes para registrar informações sobre o mesmo processo. Os dados precisam ser digitados novamente e frequentemente apresentam diferenças entre uma área e outra. Como você estruturaria uma solução para conectar esses ambientes e reduzir as inconsistências?",
},
{
  title: "Processos que Não se Conectam",
  description:
    "Um processo institucional passa por diferentes setores, mas cada área executa sua parte de forma independente. Informações se perdem nas transições e algumas atividades acabam sendo repetidas. Como você integraria esse processo para melhorar o trabalho entre as áreas?",
},
{
  title: "Sistemas que Não Conversam",
  description:
    "Um laboratório utiliza diferentes sistemas para controlar projetos, equipamentos e resultados de pesquisa. As informações permanecem separadas e os pesquisadores precisam consultar vários ambientes para acompanhar uma atividade. Que solução você adotaria para melhorar essa integração?",
},
{
  title: "Informação Presa em um Setor",
  description:
    "Uma equipe produz informações importantes para outras áreas, mas os dados permanecem em seu próprio sistema e chegam aos demais setores somente quando alguém os solicita. Isso atrasa processos e decisões. Como você faria essas informações circularem de forma integrada?",
},
{
  title: "Integração de Laboratórios",
  description:
    "Laboratórios da mesma instituição utilizam estruturas e sistemas próprios, embora participem de projetos conjuntos. A falta de conexão dificulta o acompanhamento das atividades e a utilização compartilhada das informações. Como você estruturaria a integração entre esses laboratórios?",
},
{
  title: "Projeto Multidisciplinar Fragmentado",
  description:
    "Um projeto reúne pesquisadores de diferentes áreas, mas cada equipe trabalha com seus próprios dados, ferramentas e rotinas. A coordenação tem dificuldade para construir uma visão integrada do projeto. Que intervenção você adotaria para conectar essas atividades?",
},
{
  title: "Fluxo de Informação Interrompido",
  description:
    "As informações necessárias para concluir um processo passam por várias equipes, porém não existe um fluxo integrado entre elas. Parte dos dados chega atrasada ou precisa ser solicitada novamente. Como você reorganizaria esse fluxo?",
},
{
  title: "Sistemas com Dados Diferentes",
  description:
    "Dois sistemas institucionais apresentam informações diferentes sobre os mesmos processos. Os profissionais não sabem qual registro está atualizado e precisam realizar conferências manuais. Como você enfrentaria esse problema de integração?",
},
{
  title: "Equipes sem Conexão",
  description:
    "Diferentes equipes participam de uma mesma atividade institucional, mas possuem pouca comunicação e trabalham como grupos independentes. Essa situação provoca atrasos e decisões desconectadas. Como você estruturaria uma integração mais efetiva entre elas?",
},
{
  title: "Conhecimento entre Sistemas",
  description:
    "Informações e conhecimentos importantes estão distribuídos entre diferentes sistemas da organização. Os profissionais conseguem acessar cada ambiente separadamente, mas não possuem uma visão integrada do que existe. Como você conectaria esses recursos?",
},
{
  title: "Integração após Crescimento",
  description:
    "Uma organização cresceu rapidamente e cada nova unidade adotou seus próprios sistemas e processos. Com o tempo, tornou-se difícil compartilhar dados e coordenar atividades entre as unidades. Que estratégia de integração você adotaria?",
},
{
  title: "Retrabalho entre Áreas",
  description:
    "Setores diferentes realizam etapas relacionadas de um mesmo processo, mas a falta de conexão faz com que informações sejam solicitadas, conferidas e registradas diversas vezes. Como você reduziria esse retrabalho por meio da integração?",
},
{
  title: "Rede de Pesquisa sem Integração",
  description:
    "Pesquisadores de diferentes unidades participam de uma rede de pesquisa, porém dados, experiências e resultados permanecem concentrados nos grupos que os produziram. Como você estruturaria um ambiente capaz de conectar essa rede?",
},
{
  title: "Integração de Conhecimentos Especializados",
  description:
    "Uma equipe multidisciplinar reúne especialistas que dominam partes diferentes de um problema complexo. Cada grupo apresenta boas soluções dentro de sua área, mas existe dificuldade para conectá-las. Como você promoveria a integração desses conhecimentos?",
},
{
  title: "Processo entre Universidade e Empresa",
  description:
    "Uma universidade e uma empresa desenvolvem conjuntamente um projeto de inovação, mas utilizam sistemas e procedimentos diferentes para acompanhar as atividades. Isso dificulta a troca de informações e a coordenação do projeto. Como você estruturaria essa integração?",
},
{
  title: "Decisão sem Visão Integrada",
  description:
    "Gestores recebem informações de vários setores para tomar uma decisão, mas os dados chegam separadamente e nem sempre são compatíveis. Como você criaria uma visão integrada capaz de apoiar esse processo decisório?",
},
{
  title: "Sistemas Antigos e Novos",
  description:
    "A organização implantou um novo sistema, mas algumas áreas ainda dependem de aplicações antigas que possuem informações importantes. Os ambientes não se comunicam adequadamente. Como você estruturaria a integração entre esses sistemas?",
},
{
  title: "Conhecimento Crítico Fragmentado",
  description:
    "Conhecimentos essenciais para um processo estão distribuídos entre diferentes equipes, documentos e sistemas. Nenhuma área consegue visualizar sozinha tudo o que é necessário para executar a atividade. Como você integraria esses conhecimentos?",
},
{
  title: "Comunidades sem Conexão",
  description:
    "Diferentes grupos profissionais trocam experiências dentro de suas próprias equipes, mas quase não existe interação entre essas comunidades. Problemas semelhantes são discutidos separadamente. Como você criaria conexões para ampliar a aprendizagem entre esses grupos?",
},
{
  title: "Integração para Inovação",
  description:
    "Um ambiente de inovação reúne universidade, empresas e pesquisadores, porém cada participante utiliza processos e informações próprios. A dificuldade de conexão começa a limitar projetos conjuntos. Como você estruturaria a integração desse ecossistema?",
},
{
  title: "Arquitetura Fragmentada",
  description:
    "Uma instituição incorporou sistemas ao longo dos anos sem planejar como eles deveriam se relacionar. Atualmente existem informações duplicadas, conexões improvisadas e dificuldades para realizar mudanças. Como você reorganizaria essa estrutura?",
},
{
  title: "Processos Integrados entre Unidades",
  description:
    "Unidades diferentes executam o mesmo processo utilizando procedimentos próprios. Quando precisam trabalhar juntas, surgem incompatibilidades, atrasos e retrabalho. Como você estruturaria uma integração que preserve as necessidades das unidades?",
},
{
  title: "Dados que Não Acompanham o Processo",
  description:
    "Durante um processo institucional, as atividades avançam entre diferentes setores, mas as informações necessárias nem sempre acompanham essas etapas. Os profissionais precisam buscar dados manualmente. Como você faria informação e processo avançarem de forma integrada?",
},
{
  title: "Integração em Ambiente Complexo",
  description:
    "Uma organização possui diversas áreas, tecnologias e equipes interdependentes. Mudanças realizadas em uma parte frequentemente provocam efeitos inesperados em outras. Como você estruturaria uma abordagem para compreender essas relações antes de realizar novas integrações?",
},
{
  title: "Aprendizagem entre Unidades",
  description:
    "Unidades distribuídas geograficamente enfrentam problemas semelhantes e desenvolvem soluções próprias, mas existe pouca troca entre elas. Como você estruturaria uma rede que conectasse essas equipes e permitisse utilizar conhecimentos desenvolvidos em diferentes locais?",
},
{
  title: "Integração sem Perder Autonomia",
  description:
    "Diferentes setores precisam compartilhar informações e coordenar processos, mas possuem necessidades específicas e receiam perder autonomia com uma solução totalmente centralizada. Como você estruturaria uma integração que conectasse as áreas sem eliminar suas particularidades?",
},
],
 [ResearchArea.UCR]: [
  {
    title: "Educação Corporativa Desconectada",
    description:
      "A organização oferece ações de capacitação em diferentes unidades, mas os programas funcionam de forma isolada e o conhecimento produzido não circula entre os participantes. A instituição pretende transformar essas iniciativas em uma estrutura integrada de educação corporativa. Como você estruturaria uma Universidade Corporativa em Rede para conectar pessoas, conhecimentos e unidades organizacionais?",
  },
  {
    title: "Trilhas de Aprendizagem Fragmentadas",
    description:
      "Os profissionais participam de cursos e capacitações, porém não existe uma trajetória de desenvolvimento articulada às competências necessárias para suas funções. As ações educacionais ocorrem de forma pontual e com pouca continuidade. Como você estruturaria trilhas de aprendizagem em rede para promover o desenvolvimento contínuo dos profissionais?",
  },
  {
    title: "Sustentabilidade da Educação Corporativa",
    description:
      "A organização desenvolve diversos programas de aprendizagem, mas encontra dificuldades para manter essas iniciativas ao longo do tempo e demonstrar sua contribuição para os objetivos institucionais. Como especialista, que estratégia você adotaria para fortalecer a sustentabilidade da educação corporativa em rede e como ela seria aplicada?",
  },
  {
    title: "Ecossistema Digital de Aprendizagem",
    description:
      "A organização utiliza diferentes plataformas e recursos digitais para capacitação, mas esses ambientes funcionam de forma fragmentada e oferecem poucas oportunidades de interação e compartilhamento de conhecimento. Como você estruturaria um ecossistema digital de aprendizagem capaz de integrar tecnologias, pessoas e conhecimento em rede?",
  },
  {
  title: "Capacitação Diferente em Cada Unidade",
  description:
    "As unidades da organização oferecem capacitações semelhantes, mas cada uma desenvolve seus próprios conteúdos e métodos. Isso gera duplicidade de esforços e pouca troca de conhecimento entre os profissionais. Como você estruturaria uma aprendizagem em rede para integrar essas iniciativas?",
},
{
  title: "Conhecimento Gerado nos Cursos",
  description:
    "Durante as capacitações, os profissionais compartilham experiências e desenvolvem soluções relevantes, mas esse conhecimento deixa de circular quando os cursos terminam. Como você faria esse aprendizado permanecer disponível e contribuir para outras equipes?",
},
{
  title: "Trilhas sem Relação com Competências",
  description:
    "A organização oferece muitos cursos, porém os profissionais não conseguem perceber como essas capacitações contribuem para as competências necessárias ao trabalho. Como você reorganizaria as trilhas de aprendizagem para apoiar o desenvolvimento profissional?",
},
{
  title: "Aprendizagem entre Filiais",
  description:
    "Filiais da mesma organização enfrentam problemas semelhantes e realizam capacitações próprias, mas quase não compartilham experiências ou materiais entre si. Como você estruturaria uma rede de aprendizagem capaz de conectar essas unidades?",
},
{
  title: "Cursos que Não Geram Continuidade",
  description:
    "Os profissionais participam de treinamentos e retornam às atividades, mas poucas oportunidades existem para continuar aprendendo ou trocar experiências sobre a aplicação do conteúdo. Como você transformaria essas ações em um processo contínuo de aprendizagem?",
},
{
  title: "Comunidades Depois da Capacitação",
  description:
    "Um programa de formação reúne profissionais de diferentes áreas, mas a interação termina quando as aulas são concluídas. A organização deseja manter a troca de experiências entre os participantes. Que estratégia você adotaria?",
},
{
  title: "Novas Competências para Novos Processos",
  description:
    "A organização está implantando novos processos e percebe que diferentes equipes precisam desenvolver competências que ainda não dominam. Como você estruturaria uma estratégia de educação corporativa para apoiar essa transformação?",
},
{
  title: "Aprendizagem Distribuída",
  description:
    "Profissionais trabalham em unidades geograficamente distantes e possuem poucas oportunidades de participar conjuntamente das ações de desenvolvimento. Como você estruturaria uma Universidade Corporativa em Rede para ampliar a aprendizagem entre essas unidades?",
},
{
  title: "Cursos Duplicados entre Unidades",
  description:
    "Diferentes unidades contratam ou produzem capacitações sobre os mesmos temas sem conhecer as iniciativas das demais. A situação aumenta custos e fragmenta o aprendizado. Como você reorganizaria esse processo em uma estrutura de educação corporativa em rede?",
},
{
  title: "Experiência como Fonte de Aprendizagem",
  description:
    "A organização oferece cursos formais, mas aproveita pouco a experiência acumulada pelos próprios profissionais. Muitas soluções importantes são conhecidas apenas pelas equipes que as desenvolveram. Como você incorporaria esse conhecimento ao ambiente de aprendizagem?",
},
{
  title: "Desenvolvimento sem Trajetória",
  description:
    "Os profissionais participam de capacitações ao longo dos anos, mas não existe uma sequência clara que oriente sua evolução. Como você estruturaria trajetórias de aprendizagem relacionadas ao desenvolvimento de competências?",
},
{
  title: "Aprendizagem para Novos Profissionais",
  description:
    "Novos profissionais ingressam em diferentes unidades e recebem orientações locais, resultando em experiências de aprendizagem muito diferentes. Como você estruturaria uma solução em rede para apoiar seu desenvolvimento desde o ingresso?",
},
{
  title: "Conhecimento entre Áreas",
  description:
    "Áreas diferentes possuem conhecimentos que poderiam contribuir para a formação de outros setores, mas as capacitações são organizadas separadamente. Como você criaria oportunidades de aprendizagem e compartilhamento entre essas equipes?",
},
{
  title: "Plataformas de Aprendizagem Isoladas",
  description:
    "A organização utiliza diferentes ambientes digitais para cursos, materiais e interação entre profissionais. Os usuários precisam acessar várias plataformas e o conhecimento permanece fragmentado. Como você estruturaria um ecossistema de aprendizagem mais integrado?",
},
{
  title: "Capacitação que Não Chega a Todos",
  description:
    "Algumas unidades possuem acesso frequente a programas de desenvolvimento, enquanto outras participam pouco das ações educacionais. Como você utilizaria uma estrutura de aprendizagem em rede para ampliar o acesso e integrar essas unidades?",
},
{
  title: "Competências que Precisam Evoluir",
  description:
    "Mudanças no negócio exigem novas competências dos profissionais, mas os programas de capacitação continuam concentrados em conteúdos antigos. Como você reorganizaria a educação corporativa para acompanhar essas novas necessidades?",
},
{
  title: "Aprendizagem sem Compartilhamento",
  description:
    "Os profissionais concluem cursos e desenvolvem novos conhecimentos, porém quase não existem espaços para compartilhar o que aprenderam com seus colegas. Como você faria esse aprendizado circular pela organização?",
},
{
  title: "Rede de Especialistas Internos",
  description:
    "A organização possui profissionais experientes em diferentes unidades, mas esse conhecimento é pouco aproveitado nas ações de desenvolvimento. Como você conectaria esses especialistas aos demais profissionais por meio de uma rede de aprendizagem?",
},
{
  title: "Trilhas Iguais para Necessidades Diferentes",
  description:
    "Profissionais com funções e níveis de experiência diferentes recebem praticamente as mesmas capacitações. Isso reduz o interesse e dificulta o desenvolvimento das competências necessárias. Como você estruturaria trilhas de aprendizagem mais adequadas a essas necessidades?",
},
{
  title: "Aprendizagem em Comunidade",
  description:
    "Equipes enfrentam desafios semelhantes, mas procuram soluções separadamente e raramente discutem suas experiências. Como você utilizaria comunidades de prática para fortalecer a aprendizagem em rede?",
},
{
  title: "Conhecimento após a Capacitação",
  description:
    "Depois de um programa de formação, alguns profissionais aplicam novas práticas e desenvolvem soluções úteis, mas essas experiências não retornam ao ambiente de aprendizagem. Como você faria esse conhecimento alimentar continuamente a educação corporativa?",
},
{
  title: "Universidade Corporativa em Expansão",
  description:
    "A organização está crescendo e novas unidades precisam ser incorporadas aos programas de desenvolvimento. A estrutura atual depende de ações centralizadas e tem dificuldade para acompanhar a expansão. Como você estruturaria uma Universidade Corporativa em Rede para essa nova realidade?",
},
{
  title: "Aprendizagem e Memória Organizacional",
  description:
    "A organização produz materiais, experiências e conhecimentos em seus programas de capacitação, mas parte desse conteúdo se perde com o tempo. Como você conectaria aprendizagem e memória organizacional para preservar e reutilizar esse conhecimento?",
},
{
  title: "Desenvolvimento Profissional Contínuo",
  description:
    "Os profissionais recebem capacitações em momentos específicos, mas não possuem oportunidades regulares de atualizar conhecimentos e desenvolver novas competências. Como você estruturaria um processo contínuo de desenvolvimento profissional?",
},
{
  title: "Rede de Aprendizagem sem Participação",
  description:
    "A organização criou um ambiente para conectar profissionais e compartilhar conhecimentos, mas poucas pessoas participam e as interações diminuem com o tempo. Que estratégia você adotaria para tornar essa rede parte do processo contínuo de aprendizagem?",
},
{
  title: "Ecossistema de Aprendizagem em Expansão",
  description:
    "A organização incorpora novas unidades, tecnologias e programas educacionais, mas essas iniciativas começam a funcionar de maneira independente. Como você estruturaria um ecossistema de aprendizagem capaz de conectar pessoas, conhecimentos, tecnologias e unidades?",
 },
],
};
export const getGeminiFeedback = async (
  prompt: string,
  state: GameState,
  action: string,
  team: string[],
  area: ResearchArea
) => {
const model = "gemini-3-pro-preview";

  const UFSC_COLLECTION = "https://repositorio.ufsc.br/handle/123456789/76395";
const areaSources = getSourcesByArea(area);
  const sourcesContext = areaSources
  .map(
    (s) =>
      `Fonte: ${s.titulo} (${s.ano ?? "s.d."}) — ${s.autores}. Palavras-chave: ${s.palavrasChave.join(", ")}.`
  )
  .join("\n");
const pastProposalsSummary = state.report
    .slice(0, 5)
    .map(
      (r) =>
        `Area: ${r.area}, Veredito: ${r.verdict}, Proposta: ${r.proposal.substring(
          0,
          50
        )}...`
    )
    .join("\n");

  const sources = searchSources(action, state.phase === "CORE_GAME" ? undefined : undefined);
const topSources = sources.slice(0, 5);

const evidenceBlock =
  topSources.length === 0
    ? "Nenhuma evidência científica localizada nos repositórios institucionais."
    : topSources
        .map(
          (s, i) =>
            `${i + 1}) [${s.tipo}] ${s.titulo} — ${s.autores} (${s.ano}) — ${s.instituicao}\nLink: ${s.link}`
        )
        .join("\n\n");
  
  const systemInstruction = `
Você é o facilitador do Nexus ENGIN/UFSC e deve avaliar propostas estratégicas com BASE EM EVIDÊNCIA.

CONTEXTO COLETIVO:
${pastProposalsSummary || "Início da base de dados."}

EVIDÊNCIAS CIENTÍFICAS DISPONÍVEIS:
${evidenceBlock}

INSTRUÇÕES:
- Avalie a proposta considerando coerência estratégica
- Use as evidências quando pertinentes
- Indique claramente se a proposta é CORRETA ou NEGATIVA

PRIORIDADE DE BUSCA (OBRIGATÓRIA):
1) PRIMEIRO: Repositório UFSC (DSpace) — coleção ENGIN/EGC: ${UFSC_COLLECTION}
   - Use a busca para encontrar teses/dissertações relacionadas ao DESAFIO e à PROPOSTA.
   - Prefira links do tipo: https://repositorio.ufsc.br/handle/...
2) Se NÃO houver evidência suficiente na UFSC: amplie para outras fontes acadêmicas abertas na web.

REGRAS:
- Se a resposta for genérica ou repetir o problema sem estratégia, o veredito é "NEGATIVA".
- Identifique conceitos técnicos (ex: 8'C, Auditoria do conhecimento, Governança etc.).
- Quando CORRETA: diga que a proposta corrobora com ao menos 1 autor/obra e cite.
- Quando NEGATIVA: diga por que diverge e cite ao menos 1 autor/obra que oriente o caminho correto.
- NÃO invente citações.
- NÃO afirme que acessou Scopus/Web of Science diretamente (sem APIs). Use somente resultados obtidos via busca.

FORMATO (JSON obrigatório) — responda SOMENTE em JSON:
{
  "verdict": "CORRETA" | "NEGATIVA",
  "explanation": string,
  "sourceType": "UFSC" | "MISTA" | "EXTERNA",
  "stabilityDelta": number,
  "innovationDelta": number,
  "references": string[]
}

REFERÊNCIAS:
- "references" deve conter itens no formato:
  "Autor (Ano) — Título — LINK — Trecho: <1-2 frases curtas>"
- Sempre que possível, use LINK da UFSC (handle).
`;


  try {
    const response = await ai.models.generateContent({
      model,
      contents: `
      Fontes de referência para esta área:
${sourcesContext}

DESAFIO: ${prompt}
PROPOSTA: "${action}"
EQUIPE: ${team.join(", ")}

INSTRUÇÃO DE BUSCA:
1) Pesquise PRIMEIRO dentro da coleção UFSC:
   site:repositorio.ufsc.br/handle/123456789/76395 <palavras-chave do DESAFIO e da PROPOSTA>
2) Se não achar evidência suficiente, amplie a busca para outras fontes acadêmicas abertas.
3) Produza o JSON final, incluindo referências com autor+título+link+trecho.
`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

   const generatedChallenge = JSON.parse(response.text || "{}");

const aiHistoryKey = `nexus_ai_challenges_${area}`;

let aiHistory: string[] = [];

try {
  aiHistory = JSON.parse(
    sessionStorage.getItem(aiHistoryKey) || "[]"
  );

  if (!Array.isArray(aiHistory)) {
    aiHistory = [];
  }
} catch {
  aiHistory = [];
}

const challengeSignature = String(
  generatedChallenge?.description || ""
)
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^\w\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

if (
  challengeSignature &&
  !aiHistory.includes(challengeSignature)
) {
  aiHistory.push(challengeSignature);

  sessionStorage.setItem(
    aiHistoryKey,
    JSON.stringify(aiHistory.slice(-30))
  );

  return generatedChallenge;
}

throw new Error("Desafio Gemini repetido");
  } catch (error) {
    console.error("ERRO GENERATE CHALLENGE:", error);
    return {
      verdict: "NEGATIVA",
      explanation:
        "Não foi possível obter evidências (UFSC/web) nesta tentativa. Tente novamente com termos mais específicos.",
      sourceType: "EXTERNA",
      stabilityDelta: -10,
      innovationDelta: 0,
      references: [],
    };
  }
};

export const generateChallenge = async (area: ResearchArea) => {
 const model = "gemini-3.8-flash";
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

  try {
   let response;

try {
  response = await ai.models.generateContent({
    model,
    contents: instruction,
    config: { responseMimeType: "application/json" },
  });
} catch (primaryError) {
  console.warn(
    "Gemini 3.8 Flash indisponível. Tentando modelo alternativo.",
    primaryError
  );

  response = await ai.models.generateContent({
    model: "gemini-3.7-flash",
    contents: instruction,
    config: { responseMimeType: "application/json" },
  });
}

    return JSON.parse(response.text || "{}");
} catch (error) {
  console.error("ERRO GENERATE CHALLENGE:", error);

  const challenges = FALLBACK_CHALLENGES[area];

const storageKey = `nexus_used_challenges_${area}`;

let usedIndexes: number[] = [];

try {
  usedIndexes = JSON.parse(
    sessionStorage.getItem(storageKey) || "[]"
  );
} catch {
  usedIndexes = [];
}

// Quando todas as perguntas da área forem utilizadas,
// inicia um novo ciclo.
if (usedIndexes.length >= challenges.length) {
  usedIndexes = [];
}

const availableIndexes = challenges
  .map((_, index) => index)
  .filter((index) => !usedIndexes.includes(index));

const randomIndex =
  availableIndexes[
    Math.floor(Math.random() * availableIndexes.length)
  ];

usedIndexes.push(randomIndex);

sessionStorage.setItem(
  storageKey,
  JSON.stringify(usedIndexes)
);

return challenges[randomIndex];
}
};
