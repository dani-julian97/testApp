import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createShell } from "../ui/Shell.js";
import { iconSvg } from "../ui/icons.js";
import { getState, markCompleted } from "../core/store.js";
import { haptic } from "../core/haptics.js";

function unlockDate() {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function growthChart() {
  return `
    <svg viewBox="0 0 320 140" role="img" aria-label="Growth comparison chart">
      <line x1="16" y1="100" x2="304" y2="100" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <path d="M20 95 C 80 92, 140 88, 300 82" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
      <path d="M20 95 C 70 70, 150 35, 300 18" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `;
}

export function createPlanReadyView({ onStartPlan } = {}) {
  const habitCount = getState().selectedHabitIds.length || 6;

  const body = el("div", { className: "plan fade-in" }, [
    el("div", { className: "plan__logo", text: "I" }),
    el("h1", { className: "screen-title", text: "Your Plan is Ready" }),
    el("p", {
      className: "screen-subtitle",
      text: "We've built your personalised complete reset plan for the next 90 days."
    }),
    el("div", { className: "plan__unlock" }, [
      el("span", { html: iconSvg("lock", { size: 14 }) }),
      el("span", { text: `Unlock full potential by ${unlockDate()}` })
    ]),
    el("div", { className: "plan__chart", html: growthChart() }),
    el("div", { className: "plan__legend" }, [
      el("span", {}, [el("i", { style: "color:#fff" }), " With Ikigai"]),
      el("span", {}, [el("i", { style: "color:#777" }), " Without"])
    ]),
    el("div", { className: "plan__metrics" }, [
      el("div", { className: "plan__metric" }, [
        el("strong", { text: "3" }),
        el("span", { text: "Years back" })
      ]),
      el("div", { className: "plan__metric" }, [
        el("strong", { text: String(habitCount) }),
        el("span", { text: "Core habits" })
      ]),
      el("div", { className: "plan__metric" }, [
        el("strong", { text: "90" }),
        el("span", { text: "Days to reset" })
      ])
    ]),
    el("h2", { className: "plan__access-title", text: "Get full access to" }),
    el("p", {
      className: "plan__access-copy",
      text: "Everything you need for your full 90-day reset."
    })
  ]);

  return createShell({
    body,
    footer: createButton({
      label: "Start My Plan",
      onClick: () => {
        markCompleted();
        haptic("success");
        onStartPlan?.();
      }
    })
  });
}
