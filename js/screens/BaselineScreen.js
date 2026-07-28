import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createShell } from "../ui/Shell.js";
import { createProgressBar } from "../ui/ProgressBar.js";
import { createHabitGrid } from "../ui/HabitGrid.js";
import { createSlider } from "../ui/Slider.js";
import { getCoreHabit, CORE_HABITS } from "../data/habits.js";
import { getAnswer, setAnswer } from "../core/store.js";

export function createBaselineView({ goNext, habitId, progress }) {
  const habit = getCoreHabit(habitId);
  if (!habit) return el("div");

  const cfg = habit.baseline;
  const saved = getAnswer(cfg.questionId);
  let value =
    saved != null && Number.isFinite(Number(saved))
      ? Number(saved)
      : cfg.defaultValue;

  const progressBar = createProgressBar({ percent: progress });

  const grid = createHabitGrid({
    habits: CORE_HABITS,
    activeId: habitId,
    onSelect: () => {
      /* decorative highlight of current habit during baseline */
      grid.setActive(habitId);
    }
  });

  const slider = createSlider({
    min: cfg.min,
    max: cfg.max,
    step: cfg.step,
    value,
    format: cfg.format,
    ariaLabel: cfg.question,
    onChange: (v) => {
      value = v;
      setAnswer(cfg.questionId, v);
    }
  });

  setAnswer(cfg.questionId, value);

  const isLast = habitId === CORE_HABITS[CORE_HABITS.length - 1].id;
  const cta = isLast ? "Calculate" : "Confirm";

  const body = el("div", { className: "fade-in" }, [
    progressBar.el,
    el("h1", { className: "screen-title", text: cfg.question }),
    grid.el,
    slider.el
  ]);

  return createShell({
    body,
    footer: createButton({
      label: cta,
      onClick: () => {
        setAnswer(cfg.questionId, value);
        goNext();
      }
    })
  });
}
