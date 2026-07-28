import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";

export function createWelcomeView({ goNext }) {
  const image = el("img", {
    className: "welcome__image",
    attrs: {
      src: "./assets/images/welcome.png",
      alt: "",
      decoding: "async",
      fetchpriority: "high"
    }
  });

  return el(
    "section",
    { className: "welcome", attrs: { "aria-label": "Welcome" } },
    [
      el("div", { className: "welcome__media", attrs: { "aria-hidden": "true" } }, [
        image,
        el("div", { className: "welcome__overlay" })
      ]),
      el("div", { className: "welcome__content fade-in" }, [
        el("h1", { className: "welcome__title", text: "Welcome to Ikigai" }),
        el("p", {
          className: "welcome__copy",
          text: "Ready to reset your life? Take a quick quiz and we'll create your personalized plan."
        }),
        createButton({
          label: "Get Started",
          variant: "primary",
          onClick: goNext
        })
      ])
    ]
  );
}
