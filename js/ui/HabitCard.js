import { el } from "./dom.js";
import { iconSvg } from "./icons.js";
import { haptic } from "../core/haptics.js";

export function createHabitCard({ habit, selected, onToggle }) {
  const color = habit.color;
  const categoryLabel =
    habit.category.charAt(0).toUpperCase() + habit.category.slice(1);

  const node = el(
    "button",
    {
      className: `habit-card${selected ? " is-selected" : ""}`,
      type: "button",
      style: `--habit-color: ${color}`,
      attrs: {
        "aria-pressed": selected ? "true" : "false",
        "aria-label": `${habit.title}, ${selected ? "selected" : "not selected"}`
      },
      events: {
        click: () => {
          haptic("light");
          onToggle?.(habit.id);
        }
      }
    },
    [
      el("div", {
        className: "habit-card__icon",
        html: iconSvg(habit.icon)
      }),
      el("div", { className: "habit-card__content" }, [
        el("div", { className: "habit-card__title", text: habit.title }),
        el("div", { className: "habit-card__meta", text: habit.schedule }),
        el("div", { className: "habit-card__tags" }, [
          el("span", { className: "tag", text: categoryLabel }),
          el("span", {
            className: "tag tag--muted",
            text: `${habit.xpLevel} ${habit.xp}`
          })
        ])
      ]),
      el("div", { className: "habit-card__check", attrs: { "aria-hidden": "true" } })
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
