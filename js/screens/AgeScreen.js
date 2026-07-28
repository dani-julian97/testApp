import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createShell } from "../ui/Shell.js";
import { createSlider } from "../ui/Slider.js";
import { getAnswer, setAnswer } from "../core/store.js";

export function createAgeView({ goNext, goBack }) {
  const saved = Number(getAnswer("age"));
  let age = Number.isFinite(saved) && saved > 0 ? saved : 29;

  const slider = createSlider({
    min: 13,
    max: 80,
    step: 1,
    value: age,
    format: (v) => String(v),
    ariaLabel: "Your age",
    onChange: (v) => {
      age = v;
      valueEl.textContent = String(v);
      setAnswer("age", v);
      btn.disabled = false;
    }
  });

  // Custom large display
  const valueEl = el("div", { className: "age-picker__value", text: String(age) });

  const btn = createButton({
    label: "Continue",
    onClick: () => {
      setAnswer("age", age);
      goNext();
    }
  });

  setAnswer("age", age);

  const body = el("div", { className: "age-picker fade-in" }, [
    el("h1", { className: "screen-title", text: "How old are you?" }),
    el("p", {
      className: "screen-subtitle",
      text: "We'll personalize your life timeline."
    }),
    valueEl,
    el("div", { className: "age-picker__label", text: "years old" }),
    slider.el
  ]);

  // Hide the slider's own value label visually by CSS override via structure —
  // replace slider block value: hide duplicate
  slider.el.querySelector(".slider-block__value")?.remove();

  return createShell({
    centered: true,
    body,
    footer: el("div", {}, [
      btn,
      el("button", {
        className: "btn btn--ghost btn--block",
        type: "button",
        text: "Back",
        events: { click: goBack }
      })
    ])
  });
}
