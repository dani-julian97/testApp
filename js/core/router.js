/**
 * Lightweight screen router for the SPA shell.
 */
const screens = new Map();
let currentId = null;
let root = null;

export function initRouter(appRoot) {
  root = appRoot;
}

export function registerScreen(id, { mount, onEnter, onLeave } = {}) {
  screens.set(id, { mount, onEnter, onLeave, el: null });
}

export async function navigate(id, { replace = false } = {}) {
  if (!root) throw new Error("Router not initialized");
  if (id === currentId && !replace) return;

  const next = screens.get(id);
  if (!next) throw new Error(`Unknown screen: ${id}`);

  const prevId = currentId;
  const prev = prevId ? screens.get(prevId) : null;

  if (!next.el) {
    next.el = next.mount();
    next.el.classList.add("screen");
    next.el.dataset.screen = id;
    root.appendChild(next.el);
  }

  if (prev?.el) {
    prev.el.classList.remove("is-active");
    prev.el.classList.add("is-exit");
    await prev.onLeave?.();
  }

  next.el.classList.remove("is-exit");
  // Force reflow so enter transition runs
  void next.el.offsetWidth;
  next.el.classList.add("is-active");
  currentId = id;
  await next.onEnter?.();

  if (prev?.el) {
    window.setTimeout(() => {
      prev.el?.classList.remove("is-exit");
    }, 520);
  }
}

export function getCurrentScreen() {
  return currentId;
}
