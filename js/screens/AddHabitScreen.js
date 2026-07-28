import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createShell } from "../ui/Shell.js";
import { iconSvg } from "../ui/icons.js";
import {
  HABIT_CATEGORIES,
  HABIT_COLORS,
  ICON_CHOICES,
  createCustomHabit
} from "../data/habits.js";
import { addCustomHabit } from "../core/store.js";
import { haptic } from "../core/haptics.js";

export function createAddHabitView({ onDone, onCancel }) {
  let title = "";
  let category = "mental";
  let icon = "heart";
  let color = "#a855f7";
  let xpLevel = "Minor";

  const titleInput = el("input", {
    className: "field__input",
    type: "text",
    attrs: {
      placeholder: "Habit name",
      maxlength: "40",
      autocomplete: "off"
    },
    events: {
      input: (e) => {
        title = e.target.value;
        saveBtn.disabled = title.trim().length < 2;
      }
    }
  });

  // reuse field styles from components — add minimal inline if missing
  titleInput.style.cssText =
    "width:100%;border:1.5px solid rgba(255,255,255,0.12);background:#1a1a1a;border-radius:14px;padding:0.95rem 1.05rem;outline:none;margin-bottom:1rem;";

  const catRow = el(
    "div",
    { className: "filter-row" },
    HABIT_CATEGORIES.filter((c) => c.id !== "all").map((cat) => {
      const chip = el("button", {
        className: `filter-chip${cat.id === category ? " is-active" : ""}`,
        type: "button",
        text: cat.label,
        style: `color:${cat.color}`,
        events: {
          click: () => {
            category = cat.id;
            color = cat.color;
            catRow.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("is-active"));
            chip.classList.add("is-active");
            syncColorSelection();
            haptic("light");
          }
        }
      });
      return chip;
    })
  );

  const iconGrid = el(
    "div",
    { className: "create-habit__grid" },
    ICON_CHOICES.map((name) => {
      const btn = el("button", {
        className: `create-habit__icon${name === icon ? " is-selected" : ""}`,
        type: "button",
        attrs: { "aria-label": name },
        html: iconSvg(name, { size: 18 }),
        events: {
          click: () => {
            icon = name;
            iconGrid.querySelectorAll(".create-habit__icon").forEach((c) =>
              c.classList.remove("is-selected")
            );
            btn.classList.add("is-selected");
            haptic("light");
          }
        }
      });
      return btn;
    })
  );

  const colorRow = el("div", { className: "create-habit__colors" });

  function syncColorSelection() {
    colorRow.querySelectorAll(".create-habit__color").forEach((c) => {
      c.classList.toggle("is-selected", c.dataset.color === color);
    });
  }

  HABIT_COLORS.forEach((c) => {
    colorRow.append(
      el("button", {
        className: `create-habit__color${c === color ? " is-selected" : ""}`,
        type: "button",
        dataset: { color: c },
        style: `background:${c}`,
        attrs: { "aria-label": `Color ${c}` },
        events: {
          click: () => {
            color = c;
            syncColorSelection();
            haptic("light");
          }
        }
      })
    );
  });

  const xpRow = el("div", { className: "segmented" }, [
    el("button", {
      className: "segmented__btn is-active",
      type: "button",
      text: "Minor 3XP",
      events: {
        click: (e) => {
          xpLevel = "Minor";
          xpRow.querySelectorAll(".segmented__btn").forEach((b) => b.classList.remove("is-active"));
          e.currentTarget.classList.add("is-active");
        }
      }
    }),
    el("button", {
      className: "segmented__btn",
      type: "button",
      text: "Major 5XP",
      events: {
        click: (e) => {
          xpLevel = "Major";
          xpRow.querySelectorAll(".segmented__btn").forEach((b) => b.classList.remove("is-active"));
          e.currentTarget.classList.add("is-active");
        }
      }
    })
  ]);

  const saveBtn = createButton({
    label: "Add Habit",
    disabled: true,
    onClick: () => {
      const habit = createCustomHabit({
        title,
        category,
        color,
        icon,
        xpLevel
      });
      addCustomHabit(habit);
      haptic("success");
      onDone?.(habit);
    }
  });

  const body = el("div", { className: "fade-in" }, [
    el("h1", { className: "adjust__title", text: "Create a habit" }),
    el("p", {
      className: "adjust__sub",
      text: "Pick a logo, color, and category — same style as the rest of Ikigai."
    }),
    el("p", { className: "field__label", text: "Name", style: "margin:1rem 0 0.4rem;color:#9a9a9a;font-size:0.85rem;" }),
    titleInput,
    el("p", { className: "field__label", text: "Category", style: "margin:0 0 0.4rem;color:#9a9a9a;font-size:0.85rem;" }),
    catRow,
    el("p", { className: "field__label", text: "Logo", style: "margin:0.5rem 0 0.4rem;color:#9a9a9a;font-size:0.85rem;" }),
    iconGrid,
    el("p", { className: "field__label", text: "Color", style: "margin:0 0 0.4rem;color:#9a9a9a;font-size:0.85rem;" }),
    colorRow,
    el("p", { className: "field__label", text: "XP level", style: "margin:0 0 0.4rem;color:#9a9a9a;font-size:0.85rem;" }),
    xpRow
  ]);

  return createShell({
    body,
    footer: el("div", {}, [
      saveBtn,
      el("button", {
        className: "btn btn--ghost btn--block",
        type: "button",
        text: "Cancel",
        events: { click: () => onCancel?.() }
      })
    ])
  });
}
