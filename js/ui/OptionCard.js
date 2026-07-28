import { el } from "./dom.js";
import { haptic } from "../core/haptics.js";

const CHECK_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';

export function createOptionCard({
  id,
  label,
  selected = false,
  onSelect
} = {}) {
  const node = el(
    "button",
    {
      className: `option${selected ? " is-selected" : ""}`,
      type: "button",
      dataset: { optionId: id },
      attrs: {
        "aria-pressed": selected ? "true" : "false"
      },
      events: {
        click: () => {
          haptic("light");
          onSelect?.(id);
        }
      }
    },
    [
      el("span", { className: "option__check", html: CHECK_SVG }),
      el("span", { className: "option__label", text: label })
    ]
  );

  return {
    el: node,
    setSelected(value) {
      node.classList.toggle("is-selected", value);
      node.setAttribute("aria-pressed", value ? "true" : "false");
    }
  };
}

export function createOptionList({
  options,
  selectedIds = [],
  multi = false,
  compact = false,
  onChange
}) {
  const selected = new Set(selectedIds);
  const cards = new Map();

  const list = el("div", {
    className: compact ? "option-grid is-compact" : "option-list"
  });

  options.forEach((opt) => {
    const card = createOptionCard({
      id: opt.id,
      label: opt.label,
      selected: selected.has(opt.id),
      onSelect: (id) => {
        if (multi) {
          if (selected.has(id)) selected.delete(id);
          else selected.add(id);
        } else {
          selected.clear();
          selected.add(id);
        }
        cards.forEach((c, key) => c.setSelected(selected.has(key)));
        onChange?.(multi ? [...selected] : [...selected][0] ?? null);
      }
    });
    cards.set(opt.id, card);
    list.append(card.el);
  });

  return {
    el: list,
    getSelected: () => (multi ? [...selected] : [...selected][0] ?? null)
  };
}
