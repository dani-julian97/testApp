import { el } from "./dom.js";

export function createSlider({
  min,
  max,
  step,
  value,
  format,
  onChange,
  ariaLabel = "Value"
} = {}) {
  const valueEl = el("div", {
    className: "slider-block__value",
    text: format ? format(value) : String(value)
  });

  const input = el("input", {
    className: "slider",
    type: "range",
    attrs: {
      min: String(min),
      max: String(max),
      step: String(step),
      "aria-label": ariaLabel
    },
    value: String(value),
    events: {
      input: (e) => {
        const v = Number(e.target.value);
        valueEl.textContent = format ? format(v) : String(v);
        onChange?.(v);
      }
    }
  });

  const root = el("div", { className: "slider-block" }, [valueEl, input]);

  return {
    el: root,
    setValue(v) {
      input.value = String(v);
      valueEl.textContent = format ? format(v) : String(v);
    },
    getValue: () => Number(input.value)
  };
}
