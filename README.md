# israel-mendes-git.github.io

Portfólio de Israel Mendes — jogos, ferramentas e aplicações web.
No ar em **<https://israel-mendes-git.github.io>**.

React 19 + Vite + Tailwind CSS, bilíngue (PT/EN), publicado pelo GitHub Pages a partir da pasta `docs/`.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
```

## Publicar

```bash
npm run build    # gera o sitemap, compila em docs/ e copia index.html -> 404.html
git add docs && git commit -m "deploy" && git push
```

O Pages está configurado para servir a branch `main`, pasta `/docs`. O `404.html` é uma
cópia do `index.html` — é o que faz `/projeto/3` funcionar ao ser aberto direto, já que o
Pages não sabe reescrever rotas de SPA.

## Estrutura

```
src/
  data/
    projetos.js      fonte única dos projetos — todo texto em {pt, en}
    experiencia.js   carreira, formação e stack
  i18n/
    index.jsx        provedor de idioma, t() e campo()
    strings.js       strings de interface
  components/
    CartaHero.jsx    carta do hero, com mola e arrasto em requestAnimationFrame
    ProjectCard.jsx  card com inclinação 3D
    useTilt.js       inclinação seguindo o ponteiro, sem re-render
    ui.jsx           selos, revelação por scroll, títulos de seção
    Konami.jsx       easter egg
  pages/             Home, Sobre, Projects, ProjectDetail, Contato, Footer
scripts/
  gerar-sitemap.mjs  roda no prebuild
  capturas.py        Playwright — captura as telas e checa erros de console
```

## Adicionar um projeto

Só `src/data/projetos.js`. Home, listagem, filtros, página de detalhe, contadores e sitemap
saem todos dali. Campos obrigatórios: `id`, `nome`, `engine`, `ano`, `categoria`, `tipo`,
`status`, `papel`, `stack`, `resumo`, `descricao`, `detalhes`.

- `categoria` — `jogos` · `web` · `ferramenta` · `estudo`
- `status` — `Produção` · `Finalizado` · `WIP`
- capa 16:9 em `public/images/projetos/`, em WebP; sem capa, o card cai num brasão com o ícone

## Conferir a interface

```bash
npx vite preview --port 4173
python scripts/capturas.py        # capturas em /tmp/capturas + erros de console
```

Compilar sem erro não prova que a tela funciona — o script cobre desktop, mobile, troca de
idioma e menu, e falha alto se aparecer erro de console.
