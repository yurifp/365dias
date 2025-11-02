# Scrapbook Digital — 365 dias com você

Tema dark premium com acentos neon e animações fluidas inspiradas em [animejs.com].

## Tecnologias
- HTML5 + CSS3 puro (sem build) — responsivo
- JavaScript ES Modules (ES6+)
- [Anime.js](https://animejs.com/) via CDN

## Estrutura
```
/ (raiz)
  index.html
  /css
    styles.css
  /js
    app.js
    progress.js
    animations.js
  /assets
    /images   ← coloque suas fotos aqui (nomes livres)
    /audio    ← sons opcionais (baixa intensidade)
```

## Conteúdo esperado
Seções em uma página com snap vertical:
- Intro/Capa — título "365 dias com você", micropartículas discretas
- Linha do Tempo — meses de Nov/2024 → Out/2025
- Galeria Animada — polaroids com transform 3D e flutuação sutil
- Mensagem Final — texto manuscrito + botão secreto (coração pulsa)

A barra de progresso no rodapé imita o estilo do site anime.js:
- micro traços ao longo de toda a trilha
- 12 traços principais (1 por mês)
- indicador coral que acompanha o scroll

## Como usar
1. Abra `index.html` no navegador (ou com Live Server no VS Code).
2. Coloque suas imagens em `assets/images/` e ajuste os `<img>` nos cartões polaroid.
3. Personalize legendas, textos e seções conforme preferir.

## Breakpoints
- Base: iPhone 15 (430×932)
- `@media (min-width: 430px)` — ajustes iniciais
- `@media (min-width: 768px)` — grid iPad

## Notas
- O título e legendas entram com reveal suave e easing avançado.
- O progresso do scroll controla o preenchimento e o indicador da barra.
- O timeline da intro também avança com o scroll (efeito acelerado no topo).
- Dot navigation na lateral direita com smooth scroll.

Sinta‑se à vontade para ajustar cores em `:root` em `styles.css` (`--accent`, `--accent-2`).
