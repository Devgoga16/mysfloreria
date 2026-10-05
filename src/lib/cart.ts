// Carrito guardado en el navegador (localStorage), compartido entre páginas.
export interface CartLine {
  productId: string;
  name: string;
  image: string;
  variant?: string;
  unitPrice: number;
  quantity: number;
}

const KEY = "mys-carrito";
const MAX_LINES = 50; // límite de uTracker por pedido
const listeners = new Set<(lines: CartLine[]) => void>();

function read(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* almacenamiento bloqueado: el carrito vive solo en esta página */
  }
  memory = lines;
  listeners.forEach((fn) => fn(lines));
}

let memory: CartLine[] = typeof window === "undefined" ? [] : read();

const same = (a: CartLine, id: string, variant?: string) => a.productId === id && a.variant === variant;

export const cart = {
  get: () => memory,
  count: () => memory.reduce((n, l) => n + l.quantity, 0),
  subtotal: () => memory.reduce((n, l) => n + l.unitPrice * l.quantity, 0),

  add(line: CartLine): boolean {
    const lines = [...memory];
    const found = lines.find((l) => same(l, line.productId, line.variant));
    if (found) found.quantity += line.quantity;
    else if (lines.length >= MAX_LINES) return false;
    else lines.push(line);
    write(lines);
    return true;
  },

  setQty(id: string, variant: string | undefined, quantity: number) {
    write(
      memory
        .map((l) => (same(l, id, variant) ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0),
    );
  },

  replace: (lines: CartLine[]) => write(lines),
  clear: () => write([]),

  subscribe(fn: (lines: CartLine[]) => void) {
    listeners.add(fn);
    fn(memory);
    return () => listeners.delete(fn);
  },
};

// Sincroniza si el carrito cambia en otra pestaña.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    memory = read();
    listeners.forEach((fn) => fn(memory));
  });
}
