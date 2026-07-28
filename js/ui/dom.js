/** Tiny DOM helpers to keep screens readable. */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  const { className, dataset, attrs, events, ...rest } = props;

  if (className) node.className = className;

  if (dataset) {
    Object.entries(dataset).forEach(([k, v]) => {
      node.dataset[k] = v;
    });
  }

  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => {
      if (v === false || v == null) return;
      if (v === true) node.setAttribute(k, "");
      else node.setAttribute(k, String(v));
    });
  }

  if (events) {
    Object.entries(events).forEach(([name, handler]) => {
      node.addEventListener(name, handler);
    });
  }

  Object.entries(rest).forEach(([k, v]) => {
    if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "style" && typeof v === "string") node.setAttribute("style", v);
    else if (v != null) node[k] = v;
  });

  const list = Array.isArray(children) ? children : [children];
  list.forEach((child) => {
    if (child == null || child === false) return;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });

  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}
