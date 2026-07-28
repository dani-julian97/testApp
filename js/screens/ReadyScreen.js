import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createScreenLayout } from "../ui/ScreenLayout.js";

const CHECK_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';

export function createReadyScreen() {
  const body = el("div", { className: "ready" }, [
    el("div", { className: "ready__mark", html: CHECK_SVG }),
    el("h1", { className: "ready__title", text: "You're Ready." }),
    el("p", {
      className: "ready__copy",
      text: "Your personalized Ikigai journey is ready to begin."
    }),
    createButton({
      label: "View My Plan",
      variant: "primary",
      block: true,
      onClick: () => {
        /* Plan screen not implemented yet */
      }
    })
  ]);

  const layout = createScreenLayout({ body });
  const root = el("section", {
    attrs: { "aria-label": "You're ready" }
  }, [layout.el]);

  return {
    mount: () => root,
    onEnter: async () => {
      document.body.classList.add("is-light");
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", "#eef2ef");
    }
  };
}
