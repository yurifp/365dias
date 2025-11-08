# Widget de Música Spotify

Sistema dinâmico de widgets de música integrado ao scrapbook carousel.

## Como usar

### 1. Configuração no content_map.json

Adicione as propriedades `hasMusic` e `musicConfig` no slide desejado:

```json
{
  "title": "Título do Slide",
  "caption": "Descrição...",
  "image": "./assets/images/foto.jpg",
  "date": "12.06.2025",
  "hasMusic": true,
  "musicConfig": {
    "src": "https://open.spotify.com/embed/track/TRACK_ID?utm_source=generator",
    "title": "Título da música"
  }
}
```

### 2. Como obter o link do Spotify

1. Abra o Spotify Web ou App
2. Encontre a música desejada
3. Clique em "..." → "Compartilhar" → "Incorporar faixa"
4. Copie o link que aparece no campo `src` do iframe
5. Use esse link no campo `musicConfig.src`

### 3. Propriedades disponíveis

- `hasMusic` (boolean): Define se o slide deve mostrar widget de música
- `musicConfig.src` (string): URL do embed do Spotify
- `musicConfig.title` (string): Título descritivo da música (opcional)
- `musicSrc` (string): Forma alternativa simplificada de definir apenas o src

### 4. Comportamento

- O widget é carregado de forma lazy (só quando visível)
- Animações fluidas com anime.js
- Responsivo para mobile, tablet e desktop
- Remove automaticamente widgets quando não necessários
- Posicionamento automático após mapa (se existir) ou antes dos cards

### 5. Estilos

O widget herda o tema do scrapbook e se adapta automaticamente ao tema claro/escuro da seção.

### 6. Exemplo de URL do Spotify

```
https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC?utm_source=generator
```

Onde `4uLU6hMCjMI75M1A2tKUQC` é o ID único da música no Spotify.