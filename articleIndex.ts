export type ArticleIndexItem = {
  doi?: string;
  titulo?: string;
  driveUrl?: string;
  ufscHandle?: string;
};

export const articleIndex: ArticleIndexItem[] = [
  {
    doi: "10.11606/issn.2318-04012018-092030",
    // coloque aqui links reais se quiser testar:
    // driveUrl: "https://drive.google.com/file/d/XXXX/view",
    // ufscHandle: "https://repositorio.ufsc.br/handle/XXXX/XXXX",
  },
];
