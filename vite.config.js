import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // O site é servido na raiz do domínio (israel-mendes-git.github.io),
  // então precisa ser '/' e não './' — com './' as rotas aninhadas
  // (/projeto/1) resolveriam os assets para /projeto/assets/... e quebrariam.
  base: '/',
  build: {
    // Publica em docs/ e NÃO na raiz. A raiz guarda o index.html que é o
    // template do Vite; sobrescrever ele com a saída do build faz o build
    // seguinte reempacotar o bundle antigo em vez do src/.
    outDir: 'docs',
    emptyOutDir: true,
  },
})
