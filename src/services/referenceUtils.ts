export function normalizeDoi(value: unknown): string {
  const doi = String(value ?? "").trim().replace(/^doi:\s*/i, "")
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").replace(/[.,;]+$/, "");
  return /^10\.\d{4,9}\/\S+$/i.test(doi) ? doi.toLowerCase() : "";
}

export function safeArticleLink(value: unknown): string {
  try {
    const url = new URL(String(value ?? ""));
    if (!["http:", "https:"].includes(url.protocol)) return "";
    if (url.username || url.password) return "";
    if (url.hostname === "repositorio.ufsc.br" && !/\/(?:xmlui\/)?handle\/\d+\/\d+/.test(url.pathname)) return "";
    if (url.hostname === "doi.org" && !normalizeDoi(url.href)) return "";
    if (url.pathname === "/" || /\/(?:search|discover|simple-search)(?:\/|$)/i.test(url.pathname)) return "";
    return url.href;
  } catch { return ""; }
}

function comparableTitle(title: string): string {
  return title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/([a-z])\d+$/, "$1").replace(/[^a-z0-9]+/g, " ").trim();
}

function titleDistance(left: string, right: string): number {
  let row = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i++) {
    const next = [i];
    for (let j = 1; j <= right.length; j++) next[j] = Math.min(
      next[j - 1] + 1, row[j] + 1, row[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
    row = next;
  }
  return row[right.length];
}

export function dedupeReferences<T extends { doi?: string; link: string; title: string; year?: number }>(items: T[]): T[] {
  const seenDoi = new Set<string>();
  const seenLink = new Set<string>();
  const seenTitle = new Set<string>();
  const acceptedTitles: Array<{ title: string; year?: number }> = [];
  return items.filter(item => {
    if (!item || typeof item.title !== "string" || typeof item.link !== "string") return false;
    const doi = normalizeDoi(item.doi);
    const title = item.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const link = item.link.replace(/\/$/, "").toLowerCase();
    if ((doi && seenDoi.has(doi)) || seenLink.has(link) || seenTitle.has(title)) return false;
    const comparable = comparableTitle(item.title);
    // Providers sometimes register the same work with a second DOI and a title typo.
    // Limit fuzzy matching to long titles in the same known year; retain numbered parts.
    const duplicateTitle = acceptedTitles.some(previous => {
      if (!item.year || item.year !== previous.year || comparable.length < 45 || previous.title.length < 45) return false;
      if ((comparable.match(/\d+/g) || []).join(",") !== (previous.title.match(/\d+/g) || []).join(",")) return false;
      const tolerance = Math.min(3, Math.floor(Math.min(comparable.length, previous.title.length) * 0.04));
      return Math.abs(comparable.length - previous.title.length) <= tolerance && titleDistance(comparable, previous.title) <= tolerance;
    });
    if (duplicateTitle) return false;
    if (doi) seenDoi.add(doi);
    seenLink.add(link); seenTitle.add(title);
    acceptedTitles.push({ title: comparable, year: item.year });
    return true;
  });
}
