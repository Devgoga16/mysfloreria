// Interfaz de la tienda en el navegador: tarjetas, carrito, favoritos, buscador y checkout.
import {
  getConfig, getProducts, createCheckout, UtrackerError,
  soles, priceLabel, prepLabel, isComplement, productUrl, type Product,
} from "./utracker";
import { cart, type CartLine } from "./cart";
import { favs } from "./favs";
import { waLink } from "../data/site";

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector(sel) as T;

let canBuy = true;
let productMap = new Map<string, Product>();
let allProducts: Product[] = [];

export const canBuyOnline = () => canBuy;
export const getProduct = (id: string) => productMap.get(id);

export async function loadCatalog(fresh = false) {
  const [{ store }, data] = await Promise.all([getConfig(), getProducts(fresh)]);
  canBuy = store.acceptsOnlineOrders;
  allProducts = data.products;
  productMap = new Map(data.products.map((p) => [p.id, p]));
  syncCart();
  favs.prune(new Set(productMap.keys()));
  document.documentElement.classList.toggle("no-online-orders", !canBuy);
  renderCart();
  renderFavs();
  return data;
}

/** Complementos disponibles que aún no están en el carrito. */
export function availableComplements(limit = 6) {
  const inCart = new Set(cart.get().map((l) => l.productId));
  return allProducts.filter((p) => isComplement(p) && p.inStock && !inCart.has(p.id)).slice(0, limit);
}

// ---------- Íconos ----------
const svg = (d: string) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
export const ICON = {
  plus: svg(`<path d="M12 5v14M5 12h14"/>`),
  options: svg(`<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>`),
  chat: svg(`<path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5z"/>`),
  heart: svg(`<path d="M12 20.5s-7.5-4.6-7.5-10.6A4.2 4.2 0 0 1 12 7.5a4.2 4.2 0 0 1 7.5 2.4c0 6-7.5 10.6-7.5 10.6z"/>`),
  check: svg(`<path d="m5 12.5 4.5 4.5L19 7.5"/>`),
  close: svg(`<path d="M6 6l12 12M18 6 6 18"/>`),
};

// ---------- Tarjeta de producto ----------
function badges(p: Product) {
  const out: string[] = [];
  if (!p.inStock) out.push(`<span class="badge badge--out">Agotado</span>`);
  else if (p.stock !== null && p.stock <= 5) out.push(`<span class="badge">Quedan ${p.stock}</span>`);
  if (p.preparationDays > 0) out.push(`<span class="badge">${prepLabel(p.preparationDays)}</span>`);
  if (p.pricingMode === "quoted") out.push(`<span class="badge">Por encargo</span>`);
  return out.length ? `<div class="badges">${out.join("")}</div>` : "";
}

export const favButton = (p: Product, extra = "") => {
  const on = favs.has(p.id);
  return `<button class="fav-btn${on ? " is-on" : ""}${extra}" data-fav="${esc(p.id)}" aria-pressed="${on}" aria-label="${on ? "Quitar de" : "Agregar a"} favoritos: ${esc(p.name)}">${ICON.heart}</button>`;
};

export function productCard(p: Product) {
  const id = esc(p.id);
  const url = productUrl(p);
  const action =
    !canBuy || !p.inStock
      ? `<a class="product__quick" href="${waLink(`¡Hola! Me interesa "${p.name}" 🌸`)}" target="_blank" rel="noopener" aria-label="Consultar ${esc(p.name)} por WhatsApp">${ICON.chat}<span>Consultar</span></a>`
      : p.variants.length > 1
        ? `<a class="product__quick" href="${url}" aria-label="Elegir opción de ${esc(p.name)}">${ICON.options}<span>Elegir</span></a>`
        : `<button class="product__quick" data-add="${id}" aria-label="Agregar ${esc(p.name)} al carrito">${ICON.plus}<span>Agregar</span></button>`;
  const second = p.images[1];
  return `
    <article class="product${p.inStock ? "" : " is-out"}${second ? " has-alt" : ""}">
      <div class="product__media">
        <a class="product__img" href="${url}" tabindex="-1" aria-hidden="true">
          <img src="${esc(p.images[0] ?? "/logo-completo.png")}" alt="" loading="lazy" decoding="async" />
          ${second ? `<img class="product__alt" src="${esc(second)}" alt="" loading="lazy" decoding="async" />` : ""}
        </a>
        ${badges(p)}
        ${favButton(p)}
        ${action}
      </div>
      <a class="product__info" href="${url}">
        <span class="product__cat">${esc(p.category)}</span>
        <h3>${esc(p.name)}</h3>
        <span class="product__price">${priceLabel(p)}</span>
      </a>
    </article>`;
}

/** Tarjeta compacta para complementos (carrito y página de producto). */
export function miniCard(p: Product) {
  return `
    <li class="mini">
      <img src="${esc(p.images[0] ?? "/logo-completo.png")}" alt="" loading="lazy" />
      <div class="mini__info"><strong>${esc(p.name)}</strong><span>${soles(p.price)}</span></div>
      <button class="mini__add" data-add="${esc(p.id)}" aria-label="Agregar ${esc(p.name)}">${ICON.plus}</button>
    </li>`;
}

export function renderProducts(el: HTMLElement, products: Product[]) {
  el.innerHTML = products.length
    ? products.map(productCard).join("")
    : `<div class="empty">
         <p class="serif">No encontramos arreglos con esos filtros</p>
         <p>Prueba con otra categoría, o cuéntanos qué buscas y lo armamos para ti.</p>
         <div class="empty__actions">
           <button class="btn btn--ghost" data-reset>Ver todos los arreglos</button>
           <a class="btn btn--primary" href="${waLink("¡Hola! Estoy buscando un arreglo especial 🌸")}" target="_blank" rel="noopener">Escríbenos</a>
         </div>
       </div>`;
}

export function renderSkeleton(el: HTMLElement, n = 4) {
  el.innerHTML = Array.from({ length: n }, () => `<div class="product product--skeleton" aria-hidden="true"><div class="product__media"></div><span></span><span></span></div>`).join("");
}

export function renderError(el: HTMLElement, err: unknown, retry: () => void) {
  const msg = err instanceof Error ? err.message : "No pudimos cargar el catálogo.";
  el.innerHTML = `<div class="empty"><p>${esc(msg)}</p><button class="btn btn--white">Reintentar</button></div>`;
  el.querySelector("button")!.addEventListener("click", retry);
}

// ---------- Aviso ----------
let toastTimer: number;
export function toast(msg: string) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove("is-visible"), 2600);
}

export function addToCart(p: Product, variant: string | undefined, quantity: number, quiet = false) {
  const v = p.variants.find((x) => x.name === variant);
  const ok = cart.add({
    productId: p.id,
    name: p.name,
    image: p.images[0] ?? "",
    variant: v?.name,
    unitPrice: v?.price ?? p.price,
    quantity,
  });
  if (!quiet || !ok) toast(ok ? `“${p.name}” se agregó al carrito` : "Llegaste al máximo de 50 productos distintos por pedido.");
  if (ok) bump(".cart-btn");
  return ok;
}

/** Pequeño rebote de un ícono de la cabecera para confirmar la acción. */
function bump(sel: string) {
  document.querySelectorAll<HTMLElement>(sel).forEach((b) => {
    b.classList.remove("is-bumped");
    void b.offsetWidth; // reinicia la animación si se repite seguido
    b.classList.add("is-bumped");
  });
}

function toggleFav(id: string) {
  const p = productMap.get(id);
  const on = favs.toggle(id);
  document.querySelectorAll<HTMLButtonElement>(`[data-fav="${CSS.escape(id)}"]`).forEach((b) => {
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
    if (p) b.setAttribute("aria-label", `${on ? "Quitar de" : "Agregar a"} favoritos: ${p.name}`);
  });
  if (on) bump(".fav-head");
  toast(on ? "Guardado en tus favoritos ♡" : "Quitado de tus favoritos");
}

// ---------- Paneles laterales (carrito y favoritos) ----------
type Step = "cart" | "confirm" | "waiting";
let step: Step = "cart";
let pendingUrl = "";
let checkoutOrigin = "";

function renderCart() {
  const panel = document.getElementById("cart");
  if (!panel) return;
  const lines = cart.get();
  document.querySelectorAll(".js-cart-count").forEach((el) => {
    el.textContent = String(cart.count());
    el.toggleAttribute("hidden", cart.count() === 0);
  });
  if (step !== "cart") return;

  const list = $(".drawer__body", panel);
  const foot = $(".drawer__foot", panel);
  $(".cart__msg", panel).hidden = true;

  if (!lines.length) {
    list.innerHTML = `<div class="drawer__empty">${ICON.heart}<p class="serif">Tu carrito está vacío</p><span>Elige un arreglo y aparecerá aquí.</span><a href="/tienda" class="btn btn--primary">Ver arreglos</a></div>`;
    foot.innerHTML = "";
    return;
  }

  const extras = availableComplements(4);
  list.innerHTML = `
    <ul class="lines">${lines
      .map(
        (l, i) => `
        <li class="line">
          <img src="${esc(l.image || "/logo-completo.png")}" alt="" />
          <div class="line__info">
            <strong>${esc(l.name)}</strong>
            ${l.variant ? `<small>${esc(l.variant)}</small>` : ""}
            <span class="line__price">${soles(l.unitPrice * l.quantity)}</span>
          </div>
          <div class="qty qty--sm">
            <button data-line="${i}" data-d="-1" aria-label="${l.quantity === 1 ? "Quitar" : "Menos"}">−</button>
            <span>${l.quantity}</span>
            <button data-line="${i}" data-d="1" aria-label="Más">+</button>
          </div>
        </li>`,
      )
      .join("")}</ul>
    ${
      extras.length
        ? `<div class="upsell"><p class="upsell__title">¿Le sumas un detalle?</p><ul class="minis">${extras.map(miniCard).join("")}</ul></div>`
        : ""
    }`;
  foot.innerHTML = `
    <div class="cart__total"><span>Subtotal estimado</span><strong>${soles(cart.subtotal())}</strong></div>
    <p class="cart__hint">El total final, el adelanto y el costo de delivery se confirman en el siguiente paso.</p>
    <button class="btn btn--primary btn--block" data-checkout>Ir a pagar</button>`;
}

function renderFavs() {
  const ids = favs.get();
  document.querySelectorAll(".js-fav-count").forEach((el) => {
    el.textContent = String(ids.length);
    el.toggleAttribute("hidden", ids.length === 0);
  });
  const panel = document.getElementById("favs");
  if (!panel) return;
  const body = $(".drawer__body", panel);
  const items = ids.map((id) => productMap.get(id)).filter(Boolean) as Product[];
  if (!items.length) {
    body.innerHTML = `<div class="drawer__empty">${ICON.heart}<p class="serif">Aún no tienes favoritos</p><span>Toca el ♡ de cualquier arreglo para guardarlo aquí.</span><a href="/tienda" class="btn btn--primary">Explorar la tienda</a></div>`;
    return;
  }
  body.innerHTML = `<ul class="lines">${items
    .map(
      (p) => `
      <li class="line">
        <a href="${productUrl(p)}"><img src="${esc(p.images[0] ?? "/logo-completo.png")}" alt="" /></a>
        <a class="line__info" href="${productUrl(p)}">
          <strong>${esc(p.name)}</strong>
          <small>${esc(p.category)}</small>
          <span class="line__price">${priceLabel(p)}</span>
        </a>
        <div class="line__actions">
          ${
            canBuy && p.inStock && p.variants.length <= 1
              ? `<button class="round-btn round-btn--sm round-btn--fill" data-add="${esc(p.id)}" aria-label="Agregar ${esc(p.name)} al carrito">${ICON.plus}</button>`
              : `<a class="round-btn round-btn--sm" href="${productUrl(p)}" aria-label="Ver ${esc(p.name)}">${ICON.options}</a>`
          }
          <button class="round-btn round-btn--sm" data-fav="${esc(p.id)}" aria-label="Quitar de favoritos: ${esc(p.name)}">${ICON.close}</button>
        </div>
      </li>`,
    )
    .join("")}</ul>`;
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
    $("#cart .drawer__foot").innerHTML = `
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
  $("#cart .drawer__foot").innerHTML = `
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

let lastFocus: HTMLElement | null = null;
let openDrawerId: string | null = null;

export function openDrawer(id: "cart" | "favs") {
  if (openDrawerId === id) return;
  if (openDrawerId) closeDrawer(false);
  const panel = document.getElementById(id)!;
  lastFocus = document.activeElement as HTMLElement | null;
  openDrawerId = id;
  panel.classList.add("is-open");
  $("#drawer-overlay").classList.add("is-open");
  document.body.classList.add("no-scroll");
  // foco dentro del panel para teclado y lectores de pantalla
  requestAnimationFrame(() => $<HTMLButtonElement>(`#${id} [data-drawer-close]`).focus({ preventScroll: true }));
}
export const openCart = () => openDrawer("cart");

function closeDrawer(restoreFocus = true) {
  if (!openDrawerId) return;
  document.getElementById(openDrawerId)!.classList.remove("is-open");
  $("#drawer-overlay").classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  openDrawerId = null;
  if (restoreFocus) lastFocus?.focus({ preventScroll: true });
}

// ---------- Buscador de la cabecera ----------
function initSearch() {
  document.querySelectorAll<HTMLFormElement>("[data-search]").forEach((form) => {
    const input = form.querySelector("input")!;
    const box = form.querySelector<HTMLElement>(".search-results")!;
    let timer: number;

    const close = () => {
      box.hidden = true;
      input.setAttribute("aria-expanded", "false");
    };
    const render = async () => {
      const term = norm(input.value.trim());
      if (term.length < 2) return close();
      await loadCatalog().catch(() => {});
      const words = term.split(/\s+/);
      const hits = allProducts
        .filter((p) => {
          const hay = norm(`${p.name} ${p.category} ${p.description}`);
          return words.every((w) => hay.includes(w));
        })
        .sort((a, b) => Number(isComplement(a)) - Number(isComplement(b)) || Number(b.inStock) - Number(a.inStock));
      box.innerHTML = hits.length
        ? `<ul>${hits
            .slice(0, 6)
            .map(
              (p) => `<li><a href="${productUrl(p)}">
                <img src="${esc(p.images[0] ?? "/logo-completo.png")}" alt="" />
                <span><strong>${esc(p.name)}</strong><small>${esc(p.category)}</small></span>
                <em>${priceLabel(p)}</em></a></li>`,
            )
            .join("")}</ul>
           <a class="search-results__all" href="/tienda?q=${encodeURIComponent(input.value.trim())}">Ver los ${hits.length} resultados</a>`
        : `<p class="search-results__none">No encontramos “${esc(input.value.trim())}”.<br/><a href="${waLink(`¡Hola! Estoy buscando: ${input.value.trim()} 🌸`)}" target="_blank" rel="noopener">Pregúntanos por WhatsApp</a></p>`;
      box.hidden = false;
      input.setAttribute("aria-expanded", "true");
    };

    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = window.setTimeout(render, 120);
    });
    input.addEventListener("focus", () => input.value.trim().length >= 2 && render());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { close(); input.blur(); }
      if (e.key === "ArrowDown" && !box.hidden) {
        e.preventDefault();
        box.querySelector<HTMLAnchorElement>("a")?.focus();
      }
    });
    box.addEventListener("keydown", (e) => {
      const links = [...box.querySelectorAll<HTMLAnchorElement>("a")];
      const i = links.indexOf(document.activeElement as HTMLAnchorElement);
      if (e.key === "ArrowDown") { e.preventDefault(); links[Math.min(i + 1, links.length - 1)]?.focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); (i <= 0 ? input : links[i - 1]).focus(); }
      if (e.key === "Escape") { close(); input.focus(); }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      location.href = q ? `/tienda?q=${encodeURIComponent(q)}` : "/tienda";
    });
    document.addEventListener("click", (e) => {
      if (!form.contains(e.target as Node)) close();
    });
  });
}

// ---------- Inicio (una vez por página) ----------
export function initShopUI() {
  cart.subscribe(renderCart);
  favs.subscribe(renderFavs);
  loadCatalog().catch(() => {}); // precarga para botones, favoritos y buscador
  initSearch();

  document.addEventListener("click", async (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-add],[data-fav],[data-drawer-open],[data-drawer-close],[data-line],[data-checkout],[data-go],[data-reopen],[data-back]",
    );
    if (!t) return;

    if (t.dataset.add) {
      e.preventDefault();
      await loadCatalog();
      const p = productMap.get(t.dataset.add);
      if (p) addToCart(p, p.variants[0]?.name, 1);
    } else if (t.dataset.fav) {
      e.preventDefault();
      await loadCatalog().catch(() => {});
      toggleFav(t.dataset.fav);
    } else if (t.dataset.drawerOpen) {
      e.preventDefault();
      openDrawer(t.dataset.drawerOpen as "cart" | "favs");
    } else if (t.hasAttribute("data-drawer-close")) {
      closeDrawer();
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
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeDrawer());

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
