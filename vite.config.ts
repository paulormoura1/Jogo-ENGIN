import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
   retornar {
  base: "/Jogo-ENGIN/",

  servidor: {
    porta: 3000,
    hospedar: "0.0.0.0",
  },

  plugins: [reagir()],

  definir: {
    "process.env.API_KEY": JSON.stringify(ambiente.GEMINI_API_KEY),
    "process.env.GEMINI_API_KEY": JSON.stringify(ambiente.GEMINI_API_KEY),
  },

  resolver: {
    pseudonimo: {
      "@": caminho.resolver(__dirname, "."),
    },
  },
};

      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
