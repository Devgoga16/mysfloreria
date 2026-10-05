# Integrar una tienda uTracker en tu web

Guía para montar un catálogo de uTracker en cualquier web o framework.

**Tú armas la vitrina como quieras. El checkout lo hospeda uTracker.**

```
Tu web                              uTracker
──────────────────────────          ────────────────────────────────
1. GET  /storefront/config   ─────▶  configuración + filtros
2. GET  /storefront/products ─────▶  catálogo completo
   (lo pintas a tu gusto)
3. POST /storefront/checkout ─────▶  crea la compra → devuelve URL
4. window.open(checkoutUrl)  ─────▶  pantalla de uTracker
                                     (datos, entrega, comprobante)
5. ◀──── postMessage "listo" ─────   el pedido entra al panel
```

Los datos del comprador y el comprobante de pago **nunca pasan por tu servidor**.
Tú solo sabes qué se pidió.

---

## 1. Credenciales

El dueño de la tienda genera una llave en **uTracker → Integración** y te la pasa.
Se ve así:

```
utk_live_a3f9c21b4e84d0fb52a6c19e7f2a8d4c91b
```

- Va en la cabecera `X-Store-Key` de cada petición.
- **Es publicable**: puede ir en el JavaScript del navegador, como las `pk_` de
  Stripe. Solo da acceso al catálogo (que ya es público) y a iniciar una compra.
  Nunca a pedidos, clientes ni ajustes.
- El dueño puede limitarla a ciertos dominios. Si lo hizo y tu dominio no está en
  la lista, recibirás `403`.
- Si se filtra, el dueño la revoca y genera otra. Las demás siguen vivas.

**Base de la API**

```
https://utracker-api.unify-tc.com/api
```

---

## 2. Endpoints

Todos requieren `X-Store-Key`. También se acepta `?key=...` por querystring, útil
si no puedes poner cabeceras.

### `GET /storefront/config`

La identidad de la tienda y sus opciones.

```json
{
  "store": {
    "name": "M&S Florería",
    "slug": "m-s-floreria",
    "logoUrl": "https://.../logo.png",
    "brandColor": "#c026d3",
    "phone": "51987654321",
    "schedule": [{ "day": 1, "open": "09:00", "close": "18:00" }],
    "deliveryTypes": ["pickup", "delivery_own"],
    "deliveryFranjas": ["morning", "afternoon"],
    "acceptsOnlineOrders": true
  },
  "filters": [
    { "id": "65f...", "name": "Color", "values": ["Rojo", "Blanco"] }
  ],
  "checkoutBaseUrl": "https://utracker.unify-tc.com/checkout"
}
```

| Campo | Para qué |
|---|---|
| `brandColor` | Tiñe tu vitrina con el color del negocio |
| `schedule` | `day`: 0=domingo … 6=sábado |
| `deliveryTypes` | `pickup` = recojo, `delivery_own` = delivery |
| `acceptsOnlineOrders` | **Si es `false`, no muestres botón de compra** |
| `filters` | Atributos para filtrar; cruzan con `product.attributes` |

### `GET /storefront/products`

```json
{
  "products": [
    {
      "id": "65f...",
      "kind": "product",
      "name": "Ramo de girasoles",
      "description": "12 girasoles frescos",
      "price": 90,
      "pricingMode": "fixed",
      "images": ["https://.../1.jpg"],
      "category": "Girasoles",
      "variants": [
        { "name": "Mediano", "priceModifier": 0,  "price": 90 },
        { "name": "Grande",  "priceModifier": 30, "price": 120 }
      ],
      "attributes": [{ "filter": "65f...", "values": ["Amarillo"] }],
      "inStock": true,
      "stock": 8,
      "preparationDays": 0,
      "requiresAdvance": true,
      "advanceType": "percent",
      "advanceValue": 50
    }
  ],
  "categories": ["Girasoles", "Rosas"],
  "total": 12
}
```

Notas importantes:

- **`variants[].price`** ya viene calculado. Si el producto tiene variantes, el
  comprador debe elegir una: muestra el menor como *"desde S/ 90"*.
- **`stock` es `null`** cuando el negocio no lleva control. Usa `inStock` para
  decidir si se puede comprar; `stock` solo para mostrar "quedan 3".
- **`preparationDays > 0`** significa que no está listo hoy. Avísalo ("Listo en
  3 días"); uTracker igual valida la fecha en el checkout.
- **`pricingMode: "quoted"`** = el precio es referencial, se acuerda por encargo.
  Conviene marcarlo en la vitrina.

### `GET /storefront/campaigns`

Ventas con tiempo y stock limitado. Tienen su propia página pública con stock
aparte — enlaza a `url`, no las metas en tu carrito.

```json
{
  "campaigns": [{
    "id": "65f...",
    "name": "Helados de fin de semana",
    "startDate": "2026-10-10T00:00:00.000Z",
    "endDate": "2026-10-12T00:00:00.000Z",
    "status": "active",
    "url": "https://utracker.unify-tc.com/c/e6416d1b",
    "items": [{ "name": "Fresa", "price": 12, "imageUrl": "…", "available": 8 }]
  }]
}
```

### `POST /storefront/checkout`

Convierte un carrito en una compra pendiente.

```json
{
  "items": [
    { "productId": "65f...", "quantity": 2, "variant": "Grande" }
  ],
  "returnUrl": "https://mitienda.com/gracias"
}
```

- `variant` es opcional; omítelo si el producto no tiene variantes.
- `returnUrl` es opcional: si lo mandas, aparece un botón "Volver a la tienda" al
  terminar.
- Máximo 50 líneas por pedido.

Respuesta:

```json
{
  "sessionId": "a3f9c21b…",
  "checkoutUrl": "https://utracker.unify-tc.com/checkout/a3f9c21b…",
  "totalAmount": 240,
  "advanceDue": 120,
  "expiresAt": "2026-10-05T18:30:00.000Z"
}
```

`totalAmount` y `advanceDue` los calcula el servidor contra el catálogo vivo.
Úsalos para confirmar el total antes de abrir la ventana.

**La sesión vence en 1 hora.**

---

## 3. Implementación

### Cliente mínimo

```js
const API = 'https://utracker-api.unify-tc.com/api'
const KEY = 'utk_live_…'

async function utracker(path, options = {}) {
  const res = await fetch(`${API}/storefront${path}`, {
    ...options,
    headers: {
      'X-Store-Key': KEY,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const data = await res.json()
  // Todos los errores llegan como { message }, legible para el usuario.
  if (!res.ok) throw new Error(data.message ?? 'Error inesperado')
  return data
}
```

### Pintar el catálogo

```js
const { store } = await utracker('/config')
const { products, categories } = await utracker('/products')

if (!store.acceptsOnlineOrders) {
  // La tienda no vende en línea: muestra el catálogo sin botón de compra.
}

for (const p of products) {
  render({
    nombre: p.name,
    foto: p.images[0],
    precio: p.variants.length
      ? `desde S/ ${Math.min(...p.variants.map((v) => v.price))}`
      : `S/ ${p.price}`,
    disponible: p.inStock,
  })
}
```

### Enviar a pagar

```js
async function pagar(carrito) {
  const { checkoutUrl } = await utracker('/checkout', {
    method: 'POST',
    body: JSON.stringify({
      items: carrito.map((l) => ({
        productId: l.id,
        quantity: l.cantidad,
        variant: l.variante,
      })),
      returnUrl: window.location.origin + '/gracias',
    }),
  })

  // Ventana aparte: el comprador no pierde tu web de vista.
  window.open(checkoutUrl, 'utracker-checkout', 'width=520,height=780')
}
```

### Saber cuándo terminó

```js
window.addEventListener('message', (e) => {
  if (e.data?.source !== 'utracker') return

  if (e.data.type === 'checkout:completed') {
    vaciarCarrito()
    mostrarGracias(e.data.trackingUrl) // link de seguimiento del comprador
  }
})
```

> Si prefieres redirigir en vez de abrir ventana, usa
> `window.location = checkoutUrl` y apóyate en `returnUrl`. En ese caso no
> recibirás el `postMessage`: el regreso lo maneja tu página de gracias.

---

## 4. Errores

Todos responden `{ "message": "texto legible" }`. Puedes mostrarlo tal cual.

| Código | Cuándo | Qué hacer |
|---|---|---|
| `401` | Llave ausente, inválida o revocada | Pedir una nueva al dueño |
| `403` | Tu dominio no está autorizado | Que agregue tu dominio a la llave |
| `400` | Carrito vacío, tienda sin entregas configuradas | Mostrar el mensaje |
| `404` | Tienda o sesión inexistente | — |
| `409` | Sin stock, sesión vencida o ya confirmada | **Recargar el catálogo** |
| `502` | Servicio externo caído | Reintentar |

El `409` es el que más verás en producción: significa que el catálogo cambió
desde que lo cargaste. Vuelve a pedir `/products` y avisa al comprador.

---

## 5. Antes de salir a producción

- [ ] La llave vive en una variable de entorno, no escrita en el código
- [ ] El dueño limitó la llave a tu dominio
- [ ] Manejas `acceptsOnlineOrders: false` (catálogo sin compra)
- [ ] Manejas `inStock: false` (agotado, sin botón)
- [ ] Si el producto tiene `variants`, el comprador elige una antes de agregar
- [ ] Muestras `preparationDays` cuando es mayor a 0
- [ ] Muestras `pricingMode: "quoted"` como precio referencial
- [ ] Un `409` recarga el catálogo en vez de romper
- [ ] Probaste con el bloqueador de ventanas emergentes activo

---

## Preguntas frecuentes

**¿Puedo cobrar yo y no mandar al checkout de uTracker?**
No. El pedido solo nace desde una sesión de checkout. Eso garantiza que el
precio, el stock y el adelanto se validen contra el catálogo real.

**¿Puedo meterlo en un iframe en vez de ventana?**
Funciona, pero conviene la ventana: el comprador ve el dominio de uTracker y
confía más al subir su comprobante.

**¿Qué pasa si el comprador cierra la ventana a medias?**
Nada. La sesión queda pendiente y vence en una hora. No se crea ningún pedido.

**¿Cómo pruebo sin ensuciar datos reales?**
Que el dueño cree una llave aparte, de prueba, y la revoque al terminar.
