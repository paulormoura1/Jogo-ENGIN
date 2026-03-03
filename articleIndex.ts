export type ArticleIndexItem = {
  doi?: string;
  titulo?: string;
  driveUrl?: string;
  ufscHandle?: string;
};

export const articleIndex: ArticleIndexItem[] = [
  {
    doi: "10.18616/pidi12",
    // se você ainda não tiver, pode deixar vazio por enquanto:
    // driveUrl: "https://drive.google.com/file/d/FILE_ID/view",
    // ufscHandle: "https://repositorio.ufsc.br/handle/XXXX/XXXX",
  },
];
