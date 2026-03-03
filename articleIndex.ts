export type ArticleIndexItem = {
  doi?: string;
  titulo?: string;
  driveUrl?: string;
  ufscHandle?: string;
};
export const articleIndex: ArticleIndexItem[] = [
  {
    doi: "10.11606/d.55.2018.tde-04012018-092030",
    // se quiser testar visual:
    // driveUrl: "https://drive.google.com/file/d/XXXX/view",
    // ufscHandle: "https://repositorio.ufsc.br/handle/XXXX/XXXX",
  },
];
