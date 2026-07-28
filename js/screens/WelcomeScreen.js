import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { navigate } from "../core/router.js";
import { startAmbientAudio, stopAmbientAudio } from "../core/audio.js";
import { resetQuiz, setState } from "../core/store.js";

function goToQuiz() {
  resetQuiz();
  setState({ screen: "quiz", quizStep: 0 });
  navigate("quiz");
}

export function createWelcomeScreen() {
  const image = el("img", {
    className: "welcome__image",
    attrs: {
      src: "./assets/images/welcome.png",
      alt: "",
      decoding: "async",
      fetchpriority: "high"
    }
  });

  // Restart cinematic zoom each time screen enters
  const restartZoom = () => {
    image.style.animation = "none";
    void image.offsetWidth;
    image.style.animation = "";
  };

  const content = el("div", { className: "welcome__content" }, [
    el("p", { className: "welcome__brand", text: "Ikigai" }),
    el("h1", { className: "welcome__title", text: "Welcome to Ikigai" }),
    el("p", { className: "welcome__lead", text: "Ready to reset your life?" }),
    el("p", {
      className: "welcome__copy",
      text: "Take a quick quiz and we'll create your personalized plan."
    }),
    el("div", { className: "welcome__actions" }, [
      createButton({
        label: "Get Started",
        variant: "light",
        block: true,
        onClick: goToQuiz
      }),
      el("div", { className: "welcome__links" }, [
        el("button", {
          className: "welcome__link",
          type: "button",
          text: "Log In",
          events: { click: () => navigate("login") }
        }),
        el("span", { className: "welcome__dot", attrs: { "aria-hidden": "true" } }),
        el("button", {
          className: "welcome__link",
          type: "button",
          text: "Sign Up",
          events: { click: () => navigate("signup") }
        }),
        el("span", { className: "welcome__dot", attrs: { "aria-hidden": "true" } }),
        el("button", {
          className: "welcome__link",
          type: "button",
          text: "Continue as Guest",
          events: { click: goToQuiz }
        })
      ])
    ])
  ]);

  const root = el("section", {
    className: "welcome",
    attrs: { "aria-label": "Welcome" }
  }, [
    el("div", { className: "welcome__media", attrs: { "aria-hidden": "true" } }, [
      image,
      el("div", { className: "welcome__overlay" })
    ]),
    content
  ]);

  return {
    mount: () => root,
    onEnter: async () => {
      restartZoom();
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", "#0c1612");
      await startAmbientAudio();
    },
    onLeave: async () => {
      stopAmbientAudio();
    }
  };
}
