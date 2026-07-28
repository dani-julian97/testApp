import { el } from "../ui/dom.js";
import { createShell } from "../ui/Shell.js";
import { iconSvg } from "../ui/icons.js";
import { haptic } from "../core/haptics.js";

export function createCelebrationView({ goNext }) {
  haptic("success");

  const timer = window.setTimeout(goNext, 2800);

  const body = el("div", { className: "celebration fade-in" }, [
    el("div", {
      className: "celebration__heart",
      html: iconSvg("heart", { size: 72 })
    }),
    el("h1", {
      className: "celebration__title",
      text: "Great Job! You've taken a powerful step toward a better life"
    })
  ]);

  const skip = el("button", {
    className: "btn btn--ghost btn--block",
    type: "button",
    text: "Skip",
    events: {
      click: () => {
        window.clearTimeout(timer);
        goNext();
      }
    }
  });

  return createShell({
    centered: true,
    body,
    footer: skip
  });
}
