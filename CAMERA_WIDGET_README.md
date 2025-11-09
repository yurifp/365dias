# Widget de Câmera Instantânea

Sistema interativo que simula o funcionamento de uma câmera instantânea estilo Polaroid.

## Como funciona

### 🎬 Efeito Visual
1. **Flash**: Efeito de flash branco na tela toda
2. **Animação da câmera**: A câmera "clica" com efeito de escala
3. **Impressão da foto**: Uma foto desliza para fora da câmera lentamente

### 📸 Configuração

#### Via JSON (content_map.json)
```json
{
  "stickers": [
    {
      "img_src": "./assets/stickers/sticker12.svg",
      "css": { "bottom": "-226%", "right": "8%", "width": "160px", "opacity": "1.0" },
      "action": { 
        "name": "camera-effect", 
        "args": { "photoSrc": "./assets/images/cine4.svg" } 
      }
    }
  ],
  "hasCamera": true,
  "cameraConfig": {
    "photoSrc": "./assets/images/cine4.svg",
    "title": "Foto instantânea"
  }
}
```

#### Via JavaScript
```javascript
import { createCameraEffect } from './cameraWidget.js';

const cameraElement = document.querySelector('img[src*="sticker12.svg"]');
createCameraEffect(cameraElement, {
  photoSrc: './assets/images/cine4.svg'
});
```

### 🎨 Estilos Responsivos

- **Mobile (≤430px)**: Câmera 120px, foto 90x130px
- **Tablet/Desktop (≥768px)**: Câmera 200px, foto 160x220px
- **Padrão**: Câmera 160px, foto 120x180px

### ⚡ Animações

- **Flash**: 400ms fade in/out com anime.js
- **Câmera**: Escala 1 → 1.1 → 1 em 400ms
- **Foto**: Desliza de -100% → 0% em 2500ms com easing exponencial

### 🔧 Arquitetura

- **`cameraWidget.js`**: Módulo principal
- **`sticker_actions.js`**: Integração com sistema de stickers
- **`styles.css`**: Estilos responsivos
- **`content_map.json`**: Configuração por slide

### 📱 Responsividade

O sistema se adapta automaticamente a:
- **iPhone 15**: Interface otimizada para touch
- **iPad**: Tamanhos aumentados proporcionalmente
- **Desktop**: Hover effects e tamanhos maiores

### 🎯 Uso no Scrapbook

Perfeito para slides relacionados a:
- Momentos fotográficos
- Memórias capturadas
- Experiências visuais marcantes
- Eventos especiais

### 🧩 Compatibilidade

- **Anime.js**: Animações fluidas (com fallback CSS)
- **ES6 Modules**: Importação dinâmica
- **Touch Events**: Suporte completo mobile
- **Accessibility**: Suporte a teclado e screen readers