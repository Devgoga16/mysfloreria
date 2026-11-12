// Favoritos guardados en el navegador (localStorage), compartidos entre páginas y pestañas.
const KEY = "mys-favoritos";
const listeners = new Set<(ids: string[]) => void>();

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

let ids: string[] = typeof window === "undefined" ? [] : read();

function write(next: string[]) {
  ids = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* almacenamiento bloqueado: los favoritos viven solo en esta página */
  }
  listeners.forEach((fn) => fn(ids));
}

export const favs = {
  get: () => ids,
  has: (id: string) => ids.includes(id),
  /** Agrega o quita; devuelve true si quedó como favorito. */
  toggle(id: string): boolean {
    const on = !ids.includes(id);
    write(on ? [id, ...ids] : ids.filter((x) => x !== id));
    return on;
  },
  /** Quita los que ya no existen en el catálogo. */
  prune(valid: Set<string>) {
    const next = ids.filter((x) => valid.has(x));
    if (next.length !== ids.length) write(next);
  },
  subscribe(fn: (ids: string[]) => void) {
    listeners.add(fn);
    fn(ids);
    return () => listeners.delete(fn);
  },
};

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    ids = read();
    listeners.forEach((fn) => fn(ids));
  });
}
