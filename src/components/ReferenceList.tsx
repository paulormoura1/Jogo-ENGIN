import { Evidence } from "../services/scientificSearchService";
import { normalizeDoi, safeArticleLink } from "../services/referenceUtils";

export type DisplayReference = Evidence & { titulo: string; autores: string; ano?: number };

export function ReferenceList({ sources, notice }: { sources: DisplayReference[]; notice?: string }) {
  return <section className="mt-4 space-y-3" aria-label="Referências científicas">
    <p className="text-[10px] font-orbitron text-yellow-400 uppercase tracking-widest">
      Referências científicas ({sources.length})
    </p>
    {notice && <p role="status" className="text-xs text-blue-100/80 leading-relaxed">{notice}</p>}
    <ul className="space-y-4 text-xs text-blue-100/80">
      {sources.map(source => {
        const doi = normalizeDoi(source.doi);
        const href = safeArticleLink(source.link) || (doi ? `https://doi.org/${doi}` : "");
        const search = encodeURIComponent(`${source.titulo} ${source.autores}`);
        return <li key={doi || source.link} className="border border-blue-900/50 rounded-lg p-3 leading-relaxed">
          <span className="text-white font-bold">{source.autores}</span>{" — "}
          <span>{source.titulo}{source.ano ? ` (${source.ano})` : ""}</span>
          <p className="text-[10px] text-blue-300 mt-1">{source.source === "UFSC" ? "Repositório UFSC" : `Registro acadêmico: ${source.source}`}
            {source.venue ? ` · ${source.venue}` : ""}</p>
          <p className="text-[10px] text-blue-200/80">Tipo informado pela fonte: {source.documentType || "não informado"} · {source.validationMethod === "gemini" ? "Triagem por IA" : "Triagem local"}</p>
          {source.metadataVerified && <p className="text-[10px] text-blue-200/80">Autoria conferida no registro DOI</p>}
          {source.relevanceReason && <p className="mt-2 text-blue-50">{source.relevanceReason}</p>}
          {source.evidenceExcerpt && <><p className="mt-2 text-[10px] text-blue-200/70">Trecho do resumo original:</p>
            <blockquote className="border-l-2 border-blue-500 pl-2 text-blue-100/70">“{source.evidenceExcerpt}”</blockquote></>}
          <div className="mt-2 flex flex-wrap gap-3">
            {href && <a href={href} target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline">Abrir obra</a>}
            {doi && <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-200 underline break-all">DOI: {doi}</a>}
          </div>
          <p className="mt-2 text-[10px] text-blue-200/70">Pesquisar esta obra:</p>
          <div className="flex flex-wrap gap-3 text-[10px]">
            <a href={`https://scholar.google.com/scholar?q=${search}`} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">Google Acadêmico</a>
            <a href={`https://eric.ed.gov/?q=${search}`} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">ERIC</a>
            <a href={`https://www.scopus.com/results/results.uri?src=s&sot=b&sdt=b&sl=TITLE-ABS-KEY%28${encodeURIComponent(source.titulo)}%29`} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">Scopus</a>
          </div>
        </li>;
      })}
    </ul>
  </section>;
}
