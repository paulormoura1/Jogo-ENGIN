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

    return {
      titulo: work.display_name,
      ano: work.publication_year,
      doi: work.doi?.replace("https://doi.org/", ""),
      autores: work.authorships?.map((a: any) => a.author.display_name).join(", "),
      link: work.doi || work.primary_location?.landing_page_url,
    };
  } catch (err) {
    console.error("Erro OpenAlex:", err);
    return null;
  }
}
