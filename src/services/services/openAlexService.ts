export async function enrichWithOpenAlex(title: string) {
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(title)}&per-page=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) return null;

    const work = data.results[0];

    return {
      titulo: work.display_name,
      ano: work.publication_year,
      doi: work.doi?.replace("https://doi.org/", ""),
      autores: work.authorships
        ?.map((a: any) => a.author.display_name)
        .join(", "),
      link: work.doi || work.primary_location?.landing_page_url,
    };
  } catch (err) {
    console.error("Erro OpenAlex:", err);
    return null;
  }
}
