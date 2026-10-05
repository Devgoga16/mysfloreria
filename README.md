# MyS Florería — sitio web + tienda

Hecho con [Astro](https://astro.build). El catálogo, el carrito y el pago se conectan a **uTracker**
(ver [INTEGRACION-TIENDA.md](INTEGRACION-TIENDA.md)).

## Comandos

```bash
npm install       # una sola vez
npm run dev       # desarrollo en http://localhost:4321
npm run build     # genera la web final en dist/
```

## Conectar la tienda

1. En uTracker → Integración, genera la llave (`utk_live_…`).
2. Copia `.env.example` como `.env` y pega la llave en `PUBLIC_UTRACKER_KEY`.
3. En el hosting (Netlify, Vercel, etc.) agrega la misma variable de entorno.
4. En uTracker, limita la llave al dominio de la web.

Sin llave, la web funciona en **modo demostración** con productos de ejemplo y el botón de pago
muestra un aviso.

## Qué editar

| Qué | Dónde |
|---|---|
| WhatsApp, teléfonos, correo, dirección, horario, redes | `src/data/site.ts` |
| Textos y fotos de la página de inicio | `src/pages/index.astro` |
| Productos, precios, stock, categorías | **En uTracker** (la web los lee en vivo) |
| Logo | `public/logomys.png` (original) · `logo-monograma.png` (cabecera) · `logo-completo.png` (pie) · `favicon.png` |
| Colores y tipografías | `src/styles/global.css` → `:root` |

## Estructura

```
src/
  pages/        index (inicio) · tienda · gracias
  layouts/      Base.astro (head, header, footer, carrito)
  components/   Header, Footer, ShopOverlays (carrito + detalle de producto)
  lib/          utracker.ts (API) · cart.ts (carrito) · shop.ts (interfaz) · demo.ts
  styles/       global.css · shop.css
```
