import { el, clear } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createOptionList } from "../ui/OptionCard.js";
import { createScreenLayout } from "../ui/ScreenLayout.js";
import { QUESTIONS, TOTAL_STEPS } from "../data/questions.js";
import { getState, setState, setAnswer, getAnswer } from "../core/store.js";
import { navigate } from "../core/router.js";
import { haptic } from "../core/haptics.js";

function isAnswerValid(question, answer) {
  if (!question) return false;
  if (question.type === "multi") {
    return Array.isArray(answer) && answer.length > 0;
  }
  if (question.type === "single" || question.type === "single_with_text") {
    return typeof answer === "object" && answer != null
      ? Boolean(answer.option)
      : Boolean(answer);
  }
  return false;
}

function normalizeStored(question, raw) {
  if (question.type === "multi") return Array.isArray(raw) ? raw : [];
  if (question.type === "single_with_text") {
    if (raw && typeof raw === "object") {
      return { option: raw.option ?? null, text: raw.text ?? "" };
    }
    return { option: raw ?? null, text: "" };
  }
  return raw ?? null;
}

export function createQuizScreen() {
  let layoutApi = null;
  let continueBtn = null;
  let bodyHost = null;
  let footerHost = null;
  let currentText = "";

  const root = el("section", { attrs: { "aria-label": "Onboarding questionnaire" } });

  function currentQuestion() {
    return QUESTIONS[getState().quizStep];
  }

  function updateContinueEnabled() {
    const q = currentQuestion();
    const raw = getAnswer(q.id);
    const answer =
      q.type === "single_with_text"
        ? { ...(normalizeStored(q, raw) || {}), text: currentText }
        : raw;
    continueBtn.disabled = !isAnswerValid(q, answer);
  }

  function goBack() {
    const { quizStep } = getState();
    if (quizStep <= 0) {
      navigate("welcome");
      return;
    }
    setState({ quizStep: quizStep - 1, direction: -1, screen: "quiz" });
    renderStep();
  }

  function goNext() {
    const q = currentQuestion();
    const { quizStep } = getState();

    if (q.type === "single_with_text") {
      const prev = normalizeStored(q, getAnswer(q.id));
      setAnswer(q.id, { option: prev.option, text: currentText.trim() });
    }

    haptic("medium");

    if (quizStep >= TOTAL_STEPS - 1) {
      haptic("success");
      setState({ screen: "ready" });
      navigate("ready");
      return;
    }

    setState({ quizStep: quizStep + 1, direction: 1, screen: "quiz" });
    renderStep();
  }

  function renderStep() {
    const { quizStep, direction } = getState();
    const question = QUESTIONS[quizStep];
    const stored = normalizeStored(question, getAnswer(question.id));

    if (question.type === "single_with_text") {
      currentText = stored.text || "";
    } else {
      currentText = "";
    }

    layoutApi.progress.update({
      current: quizStep + 1,
      total: TOTAL_STEPS
    });

    clear(bodyHost);

    const content = el("div", {
      className: "fade-slide-in",
      key: question.id
    });

    // Restart animation when direction changes
    content.style.animation = "none";
    void content.offsetWidth;
    content.style.animation = "";
    if (direction < 0) {
      content.style.animationName = "fade-slide-in";
    }

    content.append(
      el("h1", { className: "question-title", text: question.title }),
      el("p", { className: "question-hint", text: question.hint })
    );

    if (question.type === "multi") {
      const list = createOptionList({
        options: question.options,
        selectedIds: stored,
        multi: true,
        onChange: (ids) => {
          setAnswer(question.id, ids);
          updateContinueEnabled();
        }
      });
      content.append(list.el);
    } else if (question.type === "single") {
      const selectedIds = stored ? [stored] : [];
      const list = createOptionList({
        options: question.options,
        selectedIds,
        multi: false,
        compact: question.options.length >= 6,
        onChange: (id) => {
          setAnswer(question.id, id);
          updateContinueEnabled();
        }
      });
      content.append(list.el);
    } else if (question.type === "single_with_text") {
      const list = createOptionList({
        options: question.options,
        selectedIds: stored.option ? [stored.option] : [],
        multi: false,
        onChange: (id) => {
          setAnswer(question.id, { option: id, text: currentText });
          updateContinueEnabled();
        }
      });
      content.append(list.el);

      const textarea = el("textarea", {
        className: "field__textarea",
        attrs: { placeholder: question.textPlaceholder || "Optional" },
        value: currentText,
        events: {
          input: (e) => {
            currentText = e.target.value;
            const opt = normalizeStored(question, getAnswer(question.id)).option;
            if (opt) {
              setAnswer(question.id, { option: opt, text: currentText });
            }
          }
        }
      });

      content.append(
        el("div", {
          className: "field",
          style: "margin-top: 1.25rem"
        }, [
          el("label", {
            className: "field__label",
            text: "Anything else? (optional)"
          }),
          textarea
        ])
      );
    }

    bodyHost.append(content);

    // Back visibility
    const backBtn = root.querySelector(".icon-btn");
    if (backBtn) {
      backBtn.style.visibility = quizStep === 0 ? "hidden" : "visible";
      backBtn.disabled = quizStep === 0;
    }

    updateContinueEnabled();
  }

  function mount() {
    continueBtn = createButton({
      label: "Continue",
      variant: "primary",
      block: true,
      disabled: true,
      haptic: false,
      onClick: goNext
    });

    bodyHost = el("div");
    footerHost = el("div", {}, [continueBtn]);

    layoutApi = createScreenLayout({
      showBack: true,
      onBack: goBack,
      progress: { current: 1, total: TOTAL_STEPS },
      body: bodyHost,
      footer: footerHost
    });

    root.append(layoutApi.el);
    return root;
  }

  return {
    mount,
    onEnter: async () => {
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", "#eef2ef");
      renderStep();
    }
  };
}
