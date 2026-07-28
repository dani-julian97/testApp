import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createScreenLayout } from "../ui/ScreenLayout.js";
import { navigate } from "../core/router.js";
import { resetQuiz, setState } from "../core/store.js";

function createAuthScreen({ mode }) {
  const isLogin = mode === "login";
  const title = isLogin ? "Welcome back" : "Create your account";
  const copy = isLogin
    ? "Sign in to continue your Ikigai journey."
    : "Begin a calmer, more intentional path.";
  const cta = isLogin ? "Log In" : "Sign Up";
  const switchLabel = isLogin
    ? "Don’t have an account?"
    : "Already have an account?";
  const switchAction = isLogin ? "Sign Up" : "Log In";
  const switchTarget = isLogin ? "signup" : "login";

  const email = el("input", {
    className: "field__input",
    type: "email",
    attrs: {
      placeholder: "Email",
      autocomplete: isLogin ? "email" : "email",
      inputmode: "email"
    }
  });

  const password = el("input", {
    className: "field__input",
    type: "password",
    attrs: {
      placeholder: "Password",
      autocomplete: isLogin ? "current-password" : "new-password"
    }
  });

  const nameField = isLogin
    ? null
    : el("div", { className: "field" }, [
        el("label", { className: "field__label", text: "Name" }),
        el("input", {
          className: "field__input",
          type: "text",
          attrs: { placeholder: "Your name", autocomplete: "name" }
        })
      ]);

  const form = el("form", {
    className: "auth__form",
    events: {
      submit: (e) => {
        e.preventDefault();
      }
    }
  }, [
    nameField,
    el("div", { className: "field" }, [
      el("label", { className: "field__label", text: "Email" }),
      email
    ]),
    el("div", { className: "field" }, [
      el("label", { className: "field__label", text: "Password" }),
      password
    ]),
    createButton({
      label: cta,
      variant: "primary",
      block: true,
      type: "submit",
      onClick: () => {
        /* Auth not implemented yet */
      }
    }),
    createButton({
      label: "Continue as Guest",
      variant: "secondary",
      block: true,
      onClick: () => {
        resetQuiz();
        setState({ screen: "quiz", quizStep: 0 });
        navigate("quiz");
      }
    }),
    el("p", { className: "auth__note" }, [
      `${switchLabel} `,
      el("button", {
        type: "button",
        text: switchAction,
        events: { click: () => navigate(switchTarget) }
      })
    ])
  ]);

  const body = el("div", { className: "fade-slide-in" }, [
    el("p", { className: "auth__brand", text: "Ikigai" }),
    el("h1", { className: "auth__title", text: title }),
    el("p", { className: "auth__copy", text: copy }),
    form
  ]);

  const layout = createScreenLayout({
    showBack: true,
    onBack: () => navigate("welcome"),
    body
  });

  const root = el("section", {
    attrs: { "aria-label": title }
  }, [layout.el]);

  return {
    mount: () => root,
    onEnter: async () => {
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", "#eef2ef");
    }
  };
}

export function createLoginScreen() {
  return createAuthScreen({ mode: "login" });
}

export function createSignupScreen() {
  return createAuthScreen({ mode: "signup" });
}
