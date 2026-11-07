# Mimosa · Rustic Bakery

Web de Mimosa Rustic Bakery (Plaza de los Cocoteros, San Agustín, Gran Canaria).

Web estática (HTML, CSS y JS, sin dependencias), publicada con GitHub Pages.

- `index.html` — inicio con el vídeo de la taza
- `carta.html` — la carta y encargos
- `nosotros.html` — la historia de Julia y el local
- `eventos.html` — eventos, talleres, catas y markets
- `visitanos.html` — horario, mapa y contacto

## WhatsApp de encargos

Cuando tengáis el número, ponedlo en `js/site.js`, en la línea:

```js
const MIMOSA_WHATSAPP = '';   // p. ej. '34600123456' (prefijo sin + ni espacios)
```

Mientras esté vacío, los botones de encargo abren el chat de Instagram.
