import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createShell } from "../ui/Shell.js";
import { startPlan } from "../core/store.js";
import { haptic } from "../core/haptics.js";

const OPTIONS = [
  {
    days: 21,
    title: "21 days",
    copy: "Build momentum fast. Ideal for a focused reset sprint."
  },
  {
    days: 40,
    title: "40 days",
    copy: "Deep habit wiring. Enough time to make change stick."
  },
  {
    days: 90,
    title: "90 days",
    copy: "Full life reset. The complete Ikigai transformation."
  }
];

export function createPlanLengthView({ onPlanStarted }) {
  let selected = 90;

  const options = OPTIONS.map((opt) => {
    const node = el(
      "button",
      {
        className: `plan-option${opt.days === selected ? " is-selected" : ""}`,
        type: "button",
        events: {
          click: () => {
            selected = opt.days;
            options.forEach((o) => o.classList.remove("is-selected"));
            node.classList.add("is-selected");
            haptic("light");
          }
        }
      },
      [
        el("div", { className: "plan-option__days", text: opt.title }),
        el("div", { className: "plan-option__copy", text: opt.copy })
      ]
    );
    return node;
  });

  const body = el("div", { className: "plan-length fade-in" }, [
    el("h1", { className: "screen-title", text: "Choose your plan" }),
    el("p", {
      className: "screen-subtitle",
      text: "How long do you want to commit to your habits?"
    }),
    el("div", { className: "plan-options" }, options)
  ]);

  return createShell({
    body,
    footer: createButton({
      label: "Begin",
      onClick: () => {
        haptic("success");
        startPlan(selected);
        onPlanStarted?.();
      }
    })
  });
}
