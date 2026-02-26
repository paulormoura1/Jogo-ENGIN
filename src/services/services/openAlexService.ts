const normalizeText = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // remove pontuação
    .replace(/\s+/g, " ")
    .trim();

const titleTokens = (s: string) =>
  normalizeText(s)
    .split(" ")
    .filter((t) => t.length >= 4); // ignora tokens muito curtos

const isLikelyTitleMatch = (inputTitle: string, candidateTitle: string) => {
  const a = titleTokens(inputTitle);
  const b = new Set(titleTokens(candidateTitle));

  if (a.length === 0 || b.size === 0) return false;

  // Overlap de tokens relevantes
  let overlap = 0;
  for (const t of a) if (b.has(t)) overlap++;

  const ratio = overlap / Math.max(1, Math.min(a.length, b.size));

  // Critérios simples e robustos:
  // - pelo menos 2 tokens iguais
  // - e overlap razoável
  if (overlap >= 2 && ratio >= 0.4) return true;

  // fallback extra: prefixo normalizado parecido (ajuda em títulos curtos)
  const na = normalizeText(inputTitle);
  const nb = normalizeText(candidateTitle);
  if (na.length >= 18 && nb.includes(na.slice(0, 18))) return true;

  return false;
};

export async function enrichWithOpenAlex(params: { doi?: string; title?: string }) {
  try {
    const doiRaw = params.doi?.trim();
    const title = params.title?.trim();

    let url = "";

    // 1) DOI-first (mais preciso)
    if (doiRaw) {
      const doi = doiRaw
        .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
        .replace(/^doi:\s*/i, "");

      // OpenAlex aceita Works por DOI assim:
      // https://api.openalex.org/works/https://doi.org/<DOI>
      url = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}`;
    } else if (title) {
      // 2) fallback por título
      url = `https://api.openalex.org/works?search=${encodeURIComponent(title)}&per-page=1`;
    } else {
      return null;
    }

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();

    // Quando busca por DOI: data é o work direto
    // Quando busca por título: data.results[0] é o work
    const work = data?.id ? data : data?.results?.[0];
    if (!work) return null;
// ✅ Validação apenas quando NÃO veio por DOI (caminho de busca por título)
    if (!params.doi) {
  const inputTitle = params.title ?? "";
  const candidateTitle = work?.title ?? work?.display_name ?? "";

    if (!isLikelyTitleMatch(inputTitle, candidateTitle)) {
    return null;
  }
}
    
   const doiOnly =
  (work.doi?.replace(/^https?:\/\/doi\.org\//i, "")?.trim() as string) || "";

const doiHref = doiOnly ? `https://doi.org/${doiOnly}` : "";

const autores = (work.authorships || [])
  .map((a: any) => a?.author?.display_name)
  .filter(Boolean)
  .join(", ");

const doiClean = work.doi?.replace("https://doi.org/", "");

const landing =
  work.primary_location?.landing_page_url ||
  work.primary_location?.source?.homepage_url ||
  "";

return {
  titulo: work.display_name,
  ano: work.publication_year,
  doi: doiClean,
  autores: work.authorships?.map((a: any) => a.author.display_name).join(", "),
  // prioridade: DOI -> landing -> OpenAlex work id (nunca quebra)
  link: work.doi || landing || work.id,
};
  } catch (err) {
    console.error("Erro OpenAlex:", err);
    return null;
  }
}
