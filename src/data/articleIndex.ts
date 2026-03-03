export type ArticleIndexItem = {
  doi?: string;        // "10.xxxx/xxxx"
  titulo?: string;     // opcional, fallback
  driveUrl?: string;   // link do arquivo (não pasta)
  ufscHandle?: string; // link handle direto
};

export const articleIndex: ArticleIndexItem[] = [];
