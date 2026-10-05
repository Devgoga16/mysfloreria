// Interfaz de la tienda en el navegador: tarjetas, detalle, carrito y checkout.
import {
  getConfig, getProducts, createCheckout, UtrackerError,
  soles, priceLabel, prepLabel, type Product,
} from "./utracker";
import { cart, type CartLine } from "./cart";
import { waLink } from "../data/site";

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector(sel) as T;

let canBuy = true;
let productMap = new Map<string, Product>();

export async function loadCatalog(fresh = false) {
  const [{ store }, data] = await Promise.all([getConfig(), getProducts(fresh)]);
  canBuy = store.acceptsOnlineOrders;
  productMap = new Map(data.products.map((p) => [p.id, p]));
  syncCart();
  document.documentElement.classList.toggle("no-online-orders", !canBuy);
  return data;
}

// ---------- Tarjeta de producto ----------
function badges(p: Product) {
  const out: string[] = [];
  if (!p.inStock) out.push(`<span class="badge badge--out">Agotado</span>`);
  else if (p.stock !== null && p.stock <= 5) out.push(`<span class="badge">Quedan ${p.stock}</span>`);
  if (p.preparationDays > 0) out.push(`<span class="badge">${prepLabel(p.preparationDays)}</span>`);
  if (p.pricingMode === "quoted") out.push(`<span class="badge">Por encargo</span>`);
  return out.length ? `<div class="badges">${out.join("")}</div>` : "";
}

export function productCard(p: Product) {
  return `
    <article class="product${p.inStock ? "" : " is-out"}">
      <button class="product__open" data-open="${esc(p.id)}" aria-label="Ver ${esc(p.name)}">
        <div class="product__img">
          <img src="${esc(p.images[0] ?? "/logo-completo.png")}" alt="${esc(p.name)}" loading="lazy" />
          ${badges(p)}
        </div>
        <h3>${esc(p.name)}</h3>
        <p class="product__detail">${esc(p.category)}</p>
        <p class="product__price">${priceLabel(p)}</p>
      </button>
      ${
        !canBuy || !p.inStock
          ? `<a class="product__buy" href="${waLink(`¡Hola! Me interesa "${p.name}" 🌸`)}" target="_blank" rel="noopener">Consultar por WhatsApp ›</a>`
          : p.variants.length > 1
            ? `<button class="product__buy" data-open="${esc(p.id)}">Elegir opción ›</button>`
            : `<button class="product__buy" data-add="${esc(p.id)}">Agregar al carrito ›</button>`
      }
    </article>`;
}

export function renderProducts(el: HTMLElement, products: Product[]) {
  el.innerHTML = products.length
    ? products.map(productCard).join("")
    : `<p class="empty">No encontramos arreglos con esos filtros.</p>`;
}

export function renderSkeleton(el: HTMLElement, n = 4) {
  el.innerHTML = Array.from({ length: n }, () => `<div class="product product--skeleton"><div class="product__img"></div><span></span><span></span></div>`).join("");
}

export function renderError(el: HTMLElement, err: unknown, retry: () => void) {
  const msg = err instanceof Error ? err.message : "No pudimos cargar el catálogo.";
  el.innerHTML = `<div class="empty"><p>${esc(msg)}</p><button class="btn btn--white">Reintentar</button></div>`;
  el.querySelector("button")!.addEventListener("click", retry);
}

// ---------- Toast ----------
let toastTimer: number;
export function toast(msg: string) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove("is-visible"), 2600);
}

function addToCart(p: Product, variant: string | undefined, quantity: number) {
  const v = p.variants.find((x) => x.name === variant);
  const ok = cart.add({
    productId: p.id,
    name: p.name,
    image: p.images[0] ?? "",
    variant: v?.name,
    unitPrice: v?.price ?? p.price,
    quantity,
  });
  toast(ok ? `“${p.name}” se agregó al carrito` : "Llegaste al máximo de 50 productos distintos por pedido.");
}

// ---------- Detalle (modal) ----------
function openProduct(p: Product) {
  const dlg = $<HTMLDialogElement>("#product-modal");
  const body = $(".modal__body", dlg);
  const hasVariants = p.variants.length > 0;
  const advance =
    p.requiresAdvance && p.advanceValue
      ? p.advanceType === "percent"
        ? `Se paga un adelanto del ${p.advanceValue}% al confirmar el pedido.`
        : `Se paga un adelanto de ${soles(p.advanceValue)} al confirmar el pedido.`
      : "";

  body.innerHTML = `
    <div class="modal__img"><img src="${esc(p.images[0] ?? "/logo-completo.png")}" alt="${esc(p.name)}" /></div>
    <div class="modal__info">
      <span class="eyebrow">${esc(p.category)}</span>
      <h2 class="title">${esc(p.name)}</h2>
      <p class="modal__price" data-price>${priceLabel(p)}</p>
      <p class="modal__desc">${esc(p.description)}</p>
      ${
        hasVariants
          ? `<fieldset class="variants"><legend>Elige una opción</legend>${p.variants
              .map((v, i) => `<label><input type="radio" name="variant" value="${esc(v.name)}" ${i === 0 ? "checked" : ""}/><span>${esc(v.name)}<small>${soles(v.price)}</small></span></label>`)
              .join("")}</fieldset>`
          : ""
      }
      <ul class="modal__notes">
        ${p.pricingMode === "quoted" ? `<li>Precio referencial: el monto final se coordina según el diseño.</li>` : ""}
        ${p.preparationDays > 0 ? `<li>${prepLabel(p.preparationDays)}: elige la fecha de entrega al pagar.</li>` : ""}
        ${advance ? `<li>${advance}</li>` : ""}
        ${p.inStock && p.stock !== null && p.stock <= 5 ? `<li>¡Quedan solo ${p.stock}!</li>` : ""}
      </ul>
      ${
        canBuy && p.inStock
          ? `<div class="modal__buy">
               <div class="qty"><button data-q="-1" aria-label="Menos">−</button><input type="number" min="1" max="99" value="1" aria-label="Cantidad"/><button data-q="1" aria-label="Más">+</button></div>
               <button class="btn btn--primary" data-modal-add>Agregar al carrito</button>
             </div>`
          : `<a class="btn btn--primary" href="${waLink(`¡Hola! Me interesa "${p.name}" 🌸`)}" target="_blank" rel="noopener">${p.inStock ? "Pedir por WhatsApp" : "Agotado · Consultar por WhatsApp"}</a>`
      }
    </div>`;

  const qtyInput = body.querySelector<HTMLInputElement>(".qty input");
  body.querySelectorAll<HTMLButtonElement>("[data-q]").forEach((b) =>
    b.addEventListener("click", () => {
      qtyInput!.value = String(Math.min(99, Math.max(1, Number(qtyInput!.value) + Number(b.dataset.q))));
    }),
  );
  body.querySelectorAll<HTMLInputElement>('input[name="variant"]').forEach((r) =>
    r.addEventListener("change", () => {
      const v = p.variants.find((x) => x.name === r.value)!;
      $("[data-price]", body).textContent = soles(v.price);
    }),
  );
  if (hasVariants) $("[data-price]", body).textContent = soles(p.variants[0].price);

  body.querySelector("[data-modal-add]")?.addEventListener("click", () => {
    const variant = body.querySelector<HTMLInputElement>('input[name="variant"]:checked')?.value;
    addToCart(p, variant, Math.max(1, Number(qtyInput!.value) || 1));
    dlg.close();
  });

  dlg.showModal();
}

// ---------- Carrito (panel lateral) ----------
type Step = "cart" | "confirm" | "waiting";
let step: Step = "cart";
let pendingUrl = "";
let checkoutOrigin = "";

function renderCart() {
  const panel = $("#cart");
  const lines = cart.get();
  document.querySelectorAll(".js-cart-count").forEach((el) => {
    el.textContent = String(cart.count());
    el.toggleAttribute("hidden", cart.count() === 0);
  });
  if (step !== "cart") return;

  const list = $(".cart__lines", panel);
  const foot = $(".cart__foot", panel);
  $(".cart__msg", panel).hidden = true;

  if (!lines.length) {
    list.innerHTML = `<div class="cart__empty"><p class="serif">Tu carrito está vacío</p><a href="/tienda" class="btn btn--pill">Ver arreglos <span class="btn__icon">↗</span></a></div>`;
    foot.innerHTML = "";
    return;
  }

  list.innerHTML = lines
    .map(
      (l, i) => `
      <li class="line">
        <img src="${esc(l.image || "/logo-completo.png")}" alt="" />
        <div>
          <strong>${esc(l.name)}</strong>
          ${l.variant ? `<small>${esc(l.variant)}</small>` : ""}
          <span class="line__price">${soles(l.unitPrice * l.quantity)}</span>
        </div>
        <div class="qty qty--sm">
          <button data-line="${i}" data-d="-1" aria-label="Menos">−</button>
          <span>${l.quantity}</span>
          <button data-line="${i}" data-d="1" aria-label="Más">+</button>
        </div>
      </li>`,
    )
    .join("");
  foot.innerHTML = `
    <div class="cart__total"><span>Subtotal estimado</span><strong>${soles(cart.subtotal())}</strong></div>
    <p class="cart__hint">El total final, el adelanto y el costo de delivery se confirman en el siguiente paso.</p>
    <button class="btn btn--primary btn--block" data-checkout>Ir a pagar</button>`;
}

function showMsg(text: string) {
  const m = $("#cart .cart__msg");
  m.textContent = text;
  m.hidden = false;
}

/** Ajusta el carrito al catálogo cargado: quita lo que ya no existe o se agotó y actualiza precios. */
function syncCart() {
  const fixed: CartLine[] = [];
  for (const l of cart.get()) {
    const p = productMap.get(l.productId);
    if (!p || !p.inStock) continue;
    const v = l.variant ? p.variants.find((x) => x.name === l.variant) : undefined;
    if (l.variant && !v) continue;
    const quantity = p.stock !== null ? Math.min(l.quantity, p.stock) : l.quantity;
    if (quantity > 0) fixed.push({ ...l, quantity, unitPrice: v?.price ?? p.price });
  }
  if (JSON.stringify(fixed) !== JSON.stringify(cart.get())) cart.replace(fixed);
}

/** Tras un 409/404 recargamos el catálogo y ajustamos el carrito a lo disponible. */
async function reconcileCart() {
  await loadCatalog(true);
  document.dispatchEvent(new CustomEvent("catalog:refresh"));
}

async function startCheckout(btn: HTMLButtonElement) {
  btn.disabled = true;
  btn.textContent = "Preparando tu pedido…";
  try {
    const s = await createCheckout(
      cart.get().map((l) => ({ productId: l.productId, quantity: l.quantity, ...(l.variant ? { variant: l.variant } : {}) })),
    );
    pendingUrl = s.checkoutUrl;
    checkoutOrigin = new URL(s.checkoutUrl).origin;
    step = "confirm";
    const owesLess = s.advanceDue > 0 && s.advanceDue < s.totalAmount;
    $("#cart .cart__foot").innerHTML = `
      <div class="cart__total"><span>Total del pedido</span><strong>${soles(s.totalAmount)}</strong></div>
      ${owesLess ? `<div class="cart__total cart__total--advance"><span>Adelanto a pagar hoy</span><strong>${soles(s.advanceDue)}</strong></div>` : ""}
      <p class="cart__hint">Se abrirá una ventana segura de uTracker para tus datos, la entrega y el comprobante de pago. Tienes 1 hora para completarlo.</p>
      <button class="btn btn--primary btn--block" data-go>Continuar al pago</button>
      <button class="btn btn--block btn--ghost" data-back>Volver al carrito</button>`;
  } catch (err) {
    const e = err as UtrackerError;
    if (e.status === 409 || e.status === 404) {
      await reconcileCart().catch(() => {});
      showMsg(`${e.message} Actualizamos tu carrito con lo disponible.`);
    } else {
      showMsg(e.message);
    }
    btn.disabled = false;
    btn.textContent = "Ir a pagar";
  }
}

function goToPayment() {
  // Se abre dentro del clic para que el navegador no la bloquee.
  const w = window.open(pendingUrl, "utracker-checkout", "width=520,height=780");
  if (!w) {
    window.location.href = pendingUrl; // ventanas bloqueadas: redirigimos
    return;
  }
  step = "waiting";
  $("#cart .cart__foot").innerHTML = `
    <div class="cart__waiting">
      <span class="spinner"></span>
      <p>Completa tu pedido en la ventana de pago.<br/>Cuando termines, volverás aquí automáticamente.</p>
      <button class="btn btn--block btn--white" data-reopen>Abrir ventana de pago otra vez</button>
      <button class="btn btn--block btn--ghost" data-back>Volver al carrito</button>
    </div>`;
}

function backToCart() {
  step = "cart";
  renderCart();
}

export function openCart() {
  $("#cart").classList.add("is-open");
  $("#cart-overlay").classList.add("is-open");
  document.body.classList.add("no-scroll");
}
function closeCart() {
  $("#cart").classList.remove("is-open");
  $("#cart-overlay").classList.remove("is-open");
  document.body.classList.remove("no-scroll");
}

// ---------- Inicio (una vez por página) ----------
export function initShopUI() {
  cart.subscribe(renderCart);
  loadCatalog().catch(() => {}); // precarga para modal / botones

  document.addEventListener("click", async (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-open],[data-add],[data-cart-open],[data-cart-close],[data-line],[data-checkout],[data-go],[data-reopen],[data-back]",
    );
    if (!t) return;

    if (t.dataset.open || t.dataset.add) {
      await loadCatalog();
      const p = productMap.get((t.dataset.open || t.dataset.add)!);
      if (!p) return;
      if (t.dataset.add) addToCart(p, p.variants[0]?.name, 1);
      else openProduct(p);
    } else if (t.hasAttribute("data-cart-open")) {
      e.preventDefault();
      openCart();
    } else if (t.hasAttribute("data-cart-close")) {
      closeCart();
    } else if (t.dataset.line) {
      const l = cart.get()[Number(t.dataset.line)];
      cart.setQty(l.productId, l.variant, l.quantity + Number(t.dataset.d));
    } else if (t.hasAttribute("data-checkout")) {
      startCheckout(t as HTMLButtonElement);
    } else if (t.hasAttribute("data-go") || t.hasAttribute("data-reopen")) {
      goToPayment();
    } else if (t.hasAttribute("data-back")) {
      backToCart();
    }
  });

  // Cerrar modal al hacer clic fuera
  const dlg = $<HTMLDialogElement>("#product-modal");
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || (e.target as HTMLElement).closest("[data-modal-close]")) dlg.close();
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeCart());

  // Aviso de uTracker cuando el pedido se completó
  window.addEventListener("message", (e) => {
    if (e.data?.source !== "utracker") return;
    if (checkoutOrigin && e.origin !== checkoutOrigin) return;
    if (e.data.type === "checkout:completed") {
      cart.clear();
      try {
        if (e.data.trackingUrl) sessionStorage.setItem("mys-tracking", e.data.trackingUrl);
      } catch {}
      window.location.href = "/gracias";
    }
  });
}

