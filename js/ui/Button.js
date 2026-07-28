import { el } from "./dom.js";
import { haptic } from "../core/haptics.js";

export function createButton({
  label,
  variant = "primary",
  block = true,
  disabled = false,
  onClick,
  haptic: hapticType = "light",
  className = ""
} = {}) {
  const classes = ["btn", `btn--${variant}`];
  if (block) classes.push("btn--block");
  if (className) classes.push(className);

  const node = el(
    "button",
    {
      className: classes.join(" "),
      type: "button",
      disabled,
      events: {
        click: (e) => {
          if (e.currentTarget.disabled) return;
          if (hapticType) haptic(hapticType);
          onClick?.(e);
        }
      }
    },
    label
  );

  return node;
}
