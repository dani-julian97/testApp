import { el } from "./dom.js";
import { haptic } from "../core/haptics.js";

export function createButton({
  label,
  variant = "primary",
  block = false,
  disabled = false,
  type = "button",
  onClick,
  className = "",
  haptic: hapticType = "light"
} = {}) {
  const classes = ["btn", `btn--${variant}`];
  if (block) classes.push("btn--block");
  if (className) classes.push(className);

  return el(
    "button",
    {
      className: classes.join(" "),
      type,
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
}

export function createIconButton({ label, onClick, svg }) {
  return el(
    "button",
    {
      className: "icon-btn",
      type: "button",
      attrs: { "aria-label": label },
      events: {
        click: (e) => {
          haptic("light");
          onClick?.(e);
        }
      },
      html: svg
    }
  );
}
