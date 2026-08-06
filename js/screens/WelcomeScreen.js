import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { continueAsGuest, getAuthState } from "../core/authStore.js";

/**
 * @param {{
 *  goNext: () => void,
 *  openAuth?: (mode: 'login'|'signup') => void
 * }} api
 */
export function createWelcomeView({ goNext, openAuth }) {
  const auth = getAuthState();
  const image = el("img", {
    className: "welcome__image",
    attrs: {
      src: "./assets/images/welcome.png",
      alt: "",
      decoding: "async",
      fetchpriority: "high"
    }
  });

  const actions = [
    createButton({
      label: "Continue as guest",
      variant: "primary",
      onClick: () => {
        continueAsGuest();
        goNext();
      }
    }),
    createButton({
      label: "Log in",
      variant: "ghost",
      onClick: () => openAuth?.("login")
    }),
    createButton({
      label: "Create account",
      variant: "ghost",
      onClick: () => openAuth?.("signup")
    })
  ];

  if (auth.isAuthenticated) {
    actions.length = 0;
    actions.push(
      createButton({
        label: "Continue where I left off",
        variant: "primary",
        onClick: goNext
      }),
      createButton({
        label: "Switch account",
        variant: "ghost",
        onClick: () => openAuth?.("login")
      })
    );
  }

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
        el("div", { className: "welcome__actions" }, actions)
      ])
    ]
  );
}
