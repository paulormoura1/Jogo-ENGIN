import type { Evidence, SearchQuery } from "./scientificSearchService";
import { hasConcept, normalizeText, researchPlan, topicalRelevance } from "./researchTopics";

/** Deterministic abstract screening. This is not semantic or scientific validation. */
export function screenAbstractsLocally(candidates: Evidence[], query: SearchQuery): Evidence[] {
  if (!query.area) return [];
  const challenge = query.challenge || query.title;
  const plan = researchPlan(query.area, challenge);
  const answerTopics = researchPlan(query.area, query.proposal || "").topics;
  // Concrete workplace contexts, not broad stems such as "institution" (which
  // incorrectly admitted "institutionalised governance" of an entire society).
  const organizationalContext = /\b(?:organizac(?:ao|oes|ional|ionais)|organi[sz]ations?|organi[sz]ational|empresas?|compan(?:y|ies)|business(?:es)?|enterprises?|equipes?|teams?|departments?|departamentos?|instituic(?:ao|oes)|institutions?|profissionais|professionals?|employees?|funcionarios?|trabalhadores?|workplace|corporat(?:e|iva|ivo)|public sector|setor publico)\b/;
  const nearbyDomain = (value: string) => {
    const text = normalizeText(value);
    // Domain phrases, not any two words in an eight-word window (e.g. integration
    // "into the knowledge-based economy" is not knowledge integration).
    return plan.domains.some(group => [group, [...group].reverse()].some(([first, second]) =>
      new RegExp(`\\b${first}\\w*\\s+(?:(?:do|da|de|dos|das|of|the|and|e)\\s+){0,3}${second}\\w*\\b`).test(text)));
  };
  // The domain name itself must not count twice as both domain and problem evidence.
  const subjects = plan.topics.filter(topic => !plan.domains.some(group =>
    group.every(term => normalizeText(topic.pt).includes(term))));

  return candidates.flatMap(candidate => {
    const abstract = candidate.abstract?.trim() || "";
    if (abstract.length < 120 || abstract.split(/\s+/).length < 20) return [];
    const text = normalizeText(abstract);
    // Isolated domain words scattered across an unrelated document are insufficient.
    if (!nearbyDomain(candidate.title) && !nearbyDomain(abstract)) return [];
    if (!organizationalContext.test(text)) return [];
    const challengeText = normalizeText(challenge);
    const technicalProblem = /\b(?:sistemas?|dados|interoper\w*|digitad\w*)\b/.test(challengeText);
    const learningProblem = /\b(?:aprendiz\w*|ensino|educa\w*|capacit\w*|curso\w*)\b/.test(challengeText);
    if (technicalProblem && !learningProblem && /\b(?:course|curriculum|curricul\w*|ensino|disciplina|curso)\b/.test(normalizeText(candidate.title))) return [];
    // A relevant title cannot rescue an unrelated abstract.
    const match = topicalRelevance(query.area!, challenge, "", abstract);
    if (!match.score) return [];
    const matchedSubjects = subjects.filter(topic => topic.terms.some(term => hasConcept(text, term)));
    if (subjects.some(topic => topic.en === "knowledge retention") && !hasKnowledgeRetention(abstract)) return [];
    const required = Math.min(2, subjects.length);
    if (matchedSubjects.length < required) return [];
    const answered = answerTopics.filter(topic => topic.terms.some(term => hasConcept(text, term)));

    const sentences = abstract.match(/[^.!?]+[.!?]?/g) || [abstract];
    const excerpt = sentences.map(sentence => ({ sentence: sentence.trim(), hits: matchedSubjects.filter(topic =>
      topic.terms.some(term => hasConcept(normalizeText(sentence), term))).length }))
      .filter(item => item.sentence.length >= 40)
      .sort((a, b) => b.hits - a.hits)[0]?.sentence.slice(0, 350);
    if (!excerpt || !abstract.includes(excerpt)) return [];
    const topics = matchedSubjects.length ? matchedSubjects.map(topic => topic.pt) : match.topics;
    const coverage = subjects.length ? matchedSubjects.length / subjects.length : 0;
    const score = Math.min(0.85, 0.55 + coverage * 0.2 + Math.min(answered.length, 2) * 0.025);
    return [{ ...candidate, confidence: score, topics, semanticValidated: false, validationMethod: "local" as const,
      relevanceReason: topics.length
        ? `Assuntos encontrados no resumo: ${topics.join("; ")}.`
        : "O resumo aborda assuntos desta área.",
      evidenceExcerpt: excerpt }];
  }).sort((a, b) => b.confidence - a.confidence);
}

function hasKnowledgeRetention(abstract: string): boolean {
  // Retaining employees/customers is a different outcome from retaining their knowledge.
  // Keep the relation inside a sentence and disallow a different retained object.
  return abstract.split(/[.!?]/).some(sentence => {
    const words = normalizeText(sentence).split(" ");
    return words.some((word, index) => /^(?:retenc|retention|perda|loss|rotativ|turnover)/.test(word) &&
      words.some((other, otherIndex) => /^(?:knowledge|conhecimento|saber)$/.test(other) && Math.abs(index - otherIndex) <= 7 &&
        !words.slice(Math.max(0, Math.min(index, otherIndex) - 1), Math.max(index, otherIndex) + 2)
          .some(part => /^(?:employee|staff|customer|client|funcionario|colaborador|pessoas|trabalhador)/.test(part))));
  });
}
