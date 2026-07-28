import { el, clear } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createShell } from "../ui/Shell.js";
import { createHabitCard } from "../ui/HabitCard.js";
import { ALL_HABITS, HABIT_CATEGORIES, CORE_HABITS } from "../data/habits.js";
import { getState, toggleHabit, isHabitSelected } from "../core/store.js";

function displayCategory(habit) {
  if (habit.category === "routine") return "Routine";
  return habit.category;
}

function matchesFilter(habit, filter) {
  if (filter === "all") return true;
  if (filter === "focus") return habit.category === "focus";
  return habit.category === filter;
}

export function createAdjustHabitsView({ goNext }) {
  let filter = "all";
  const listHost = el("div", { className: "habit-list" });

  function orderedHabits() {
    const extras = ALL_HABITS.filter((h) => !CORE_HABITS.some((c) => c.id === h.id));
    const pool = filter === "all" ? [...CORE_HABITS, ...extras] : ALL_HABITS;
    return pool.filter((h) => matchesFilter(h, filter));
  }

  function renderList() {
    clear(listHost);
    orderedHabits().forEach((habit) => {
      const card = createHabitCard({
        habit: { ...habit, category: displayCategory(habit) },
        selected: isHabitSelected(habit.id),
        onToggle: (id) => {
          toggleHabit(id);
          renderList();
          updateContinue();
        }
      });
      listHost.append(card.el);
    });
  }

  const chips = HABIT_CATEGORIES.map((cat) => {
    const chip = el("button", {
      className: `filter-chip${cat.id === filter ? " is-active" : ""}`,
      type: "button",
      text: cat.label,
      style: cat.id !== "all" ? `color:${cat.color}` : "",
      events: {
        click: () => {
          filter = cat.id;
          chips.forEach((c) => c.classList.remove("is-active"));
          chip.classList.add("is-active");
          renderList();
        }
      }
    });
    return chip;
  });

  const continueBtn = createButton({
    label: "Continue",
    onClick: goNext
  });

  function updateContinue() {
    continueBtn.disabled = getState().selectedHabitIds.length === 0;
  }

  renderList();
  updateContinue();

  const body = el("div", { className: "fade-in" }, [
    el("h1", { className: "adjust__title", text: "Adjust your habits" }),
    el("p", {
      className: "adjust__sub",
      text: "Skip to edit your habits later."
    }),
    el("div", { className: "filter-row" }, chips),
    el("p", { className: "hint-label", text: "Habits can be adjusted later" }),
    listHost
  ]);

  return createShell({
    body,
    footer: continueBtn
  });
}
