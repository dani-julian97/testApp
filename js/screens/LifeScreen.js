import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createShell } from "../ui/Shell.js";
import { createLifeDots } from "../ui/LifeDots.js";
import { getAge, getAnswer } from "../core/store.js";
import { LIFE_EXPECTANCY, yearsLostToPhone } from "../data/habits.js";

export function createLifeView({ goNext, variant }) {
  const age = getAge();
  const yearsLeft = Math.max(0, LIFE_EXPECTANCY - age);
  const socialHours = Number(getAnswer("social_hours")) || 0;
  const lost = yearsLostToPhone(socialHours);

  let title = "This is your life.";
  let caption = `You are here — age ${age}.`;
  let mode = "lived";
  let cta = "Continue";

  if (variant === "left") {
    title = "This is what you have left.";
    caption = `${yearsLeft} years ahead of you.`;
    mode = "left";
    cta = "Next";
  } else if (variant === "phone") {
    const years = Math.max(1, lost || 7);
    title = `You're on track to lose ${years} years to your phone.`;
    caption = "";
    mode = "phone";
    cta = "Next";
  }

  const phoneYears = Math.max(1, lost || 7);

  const body = el("div", { className: "life-screen fade-in" }, [
    el("h1", { className: "screen-title screen-title--lg", text: title }),
    createLifeDots({
      age,
      mode,
      yearsLost: variant === "phone" ? phoneYears : lost
    }),
    caption ? el("p", { className: "life-caption", text: caption }) : null
  ]);

  return createShell({
    centered: true,
    body,
    footer: createButton({ label: cta, onClick: goNext })
  });
}
