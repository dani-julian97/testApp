import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createShell } from "../ui/Shell.js";
import { getCoreHabit } from "../data/habits.js";
import { iconSvg } from "../ui/icons.js";

export function createHabitDetailView({ goNext, habitId }) {
  const habit = getCoreHabit(habitId);
  if (!habit) return el("div");

  const benefits = el(
    "div",
    { className: "benefit-list" },
    habit.benefits.map((text) =>
      el("div", { className: "benefit-item" }, [
        el("div", {
          className: "benefit-item__check",
          html: iconSvg("check", { size: 12 })
        }),
        el("span", { text })
      ])
    )
  );

  const stats = el(
    "div",
    { className: "stats-card" },
    [
      el("div", { className: "stats-card__title", text: "After 90 days..." }),
      ...habit.stats.map((row) =>
        el("div", { className: "stats-card__row" }, [
          el("span", { className: "stats-card__label", text: row.label }),
          el("span", { className: "stats-card__value", text: row.value })
        ])
      )
    ]
  );

  const body = el(
    "div",
    {
      className: "habit-detail fade-in",
      style: `--habit-color: ${habit.color}`
    },
    [
      el("div", {
        className: "habit-detail__icon",
        html: iconSvg(habit.icon, { size: 52 })
      }),
      el("h1", { className: "habit-detail__title", text: habit.title }),
      benefits,
      stats
    ]
  );

  return createShell({
    body,
    footer: createButton({ label: "Continue", onClick: goNext })
  });
}
