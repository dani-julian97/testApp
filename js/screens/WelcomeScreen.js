import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { continueAsGuest, getAuthState } from "../core/authStore.js";
import { hasActivePlan } from "../core/store.js";

/**
 * @param {{
 *  goNext: () => void,
 *  openAuth?: (mode: 'login'|'signup') => void,
 *  enterMainApp?: () => void
 * }} api
 */
export function createWelcomeView({ goNext, openAuth, enterMainApp }) {
  const auth = getAuthState();
  const hasPlan = hasActivePlan();

  const image = el("img", {
    className: "welcome__image",
    attrs: {
      src: "./assets/images/welcome.png",
      alt: "",
      decoding: "async",
      fetchpriority: "high"
    }
  });

  /** @type {HTMLElement[]} */
  let actions = [];

  if (hasPlan) {
    actions = [
      createButton({
        label: "Continue my path",
        variant: "primary",
        onClick: () => enterMainApp?.()
      }),
      createButton({
        label: auth.isAuthenticated ? "Switch account" : "Log in",
        variant: "ghost",
        onClick: () => openAuth?.("login")
      }),
      createButton({
        label: "Create account",
        variant: "ghost",
        onClick: () => openAuth?.("signup")
      })
    ];
  } else if (auth.isAuthenticated) {
    actions = [
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
    ];
  } else {
    actions = [
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
  }

  const copy = hasPlan
    ? "Welcome back. Pick up your path, or sign in to sync across devices."
    : "Ready to reset your life? Take a quick quiz and we'll create your personalized path.";

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
          text: copy
        }),
        el("div", { className: "welcome__actions" }, actions)
      ])
    ]
  );
}
