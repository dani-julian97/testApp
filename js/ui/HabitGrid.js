import { el } from "./dom.js";
import { iconSvg } from "./icons.js";
import { CORE_HABITS } from "../data/habits.js";
import { haptic } from "../core/haptics.js";

export function createHabitGrid({
  habits = CORE_HABITS,
  activeId = null,
  onSelect
} = {}) {
  const root = el("div", {
    className: "habit-grid",
    attrs: { role: "list" }
  });

  const tiles = new Map();

  habits.forEach((habit) => {
    const tile = el(
      "button",
      {
        className: `habit-tile${habit.id === activeId ? " is-active is-highlight" : ""}`,
        type: "button",
        attrs: { role: "listitem", "aria-pressed": habit.id === activeId ? "true" : "false" },
        events: {
          click: () => {
            haptic("light");
            onSelect?.(habit.id);
          }
        }
      },
      [
        el("div", {
          className: "habit-tile__icon",
          html: iconSvg(habit.icon)
        }),
        el("div", { className: "habit-tile__label", text: habit.title })
      ]
    );
    tiles.set(habit.id, tile);
    root.append(tile);
  });

  return {
    el: root,
    setActive(id) {
      tiles.forEach((tile, key) => {
        const on = key === id;
        tile.classList.toggle("is-active", on);
        tile.classList.toggle("is-highlight", on);
        tile.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
  };
}
