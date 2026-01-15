import caminho from 'caminho';
import { defineConfig, carregarAmbiente } from 'convite';
import reagir from '@vitejs/plugin-react';

exportar padrão defineConfig(({ modo }) => {
  const ambiente = carregarAmbiente(modo, '.', '');

  retornar {
    base: '/Jogo-ENGIN/',

    servidor: {
      porta: 3000,
      hospedagem: '0.0.0.0',
    },

    plugins: [reagir()],

    definir: {
      'process.env.API_KEY': JSON.stringify(ambiente.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(ambiente.GEMINI_API_KEY),
    },

    resolver: {
      pseudonimo: {
        '@': caminho.resolver(__dirname, '.'),
      },
    },
  };
});
