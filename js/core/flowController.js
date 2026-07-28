import { el, clear } from "../ui/dom.js";
import { FLOW, getStep, getProgressPercent } from "../data/flow.js";
import {
  getState,
  setStep,
  hasUnfinishedOnboarding,
  hasActivePlan
} from "./store.js";
import { haptic } from "./haptics.js";
import { createWelcomeView } from "../screens/WelcomeScreen.js";
import { createAgeView } from "../screens/AgeScreen.js";
import { createHabitDetailView } from "../screens/HabitDetailScreen.js";
import { createBaselineView } from "../screens/BaselineScreen.js";
import { createLifeView } from "../screens/LifeScreen.js";
import { createCalculatingView } from "../screens/CalculatingScreen.js";
import { createStatsView } from "../screens/StatsScreen.js";
import { createAdjustHabitsView } from "../screens/AdjustHabitsScreen.js";
import { createContractView } from "../screens/ContractScreen.js";
import { createCelebrationView } from "../screens/CelebrationScreen.js";
import { createNotificationsView } from "../screens/NotificationsScreen.js";
import { createPlanReadyView } from "../screens/PlanReadyScreen.js";
import { createPlanLengthView } from "../screens/PlanLengthScreen.js";
import { startAmbientAudio, stopAmbientAudio } from "./audio.js";
import { startMainApp } from "../app/MainApp.js";

export function startApp(root) {
  if (hasActivePlan()) {
    startMainApp(root);
    return { mode: "main" };
  }
  return startOnboarding(root);
}

export function startOnboarding(root) {
  clear(root);
  const host = el("div", {
    style: "position:relative;width:100%;height:100%;"
  });
  root.append(host);

  let currentView = null;
  let animLock = false;
  let choosingPlan = false;

  function mountView(factory, { back = false } = {}) {
    if (animLock) return;
    animLock = true;

    const nextEl = factory({
      goNext,
      goBack,
      refresh: () => render({ replace: true }),
      goToPlanLength,
      enterMainApp
    });

    nextEl.classList.add("screen");
    if (back) nextEl.classList.add("is-back");
    host.appendChild(nextEl);
    void nextEl.offsetWidth;
    nextEl.classList.add("is-active");

    const prev = currentView;
    if (prev) {
      prev.classList.remove("is-active");
      prev.classList.add("is-exit");
      window.setTimeout(() => prev.remove(), 480);
    }

    currentView = nextEl;
    window.setTimeout(() => {
      animLock = false;
    }, 320);
  }

  function enterMainApp() {
    stopAmbientAudio();
    startMainApp(root);
  }

  function goToPlanLength() {
    choosingPlan = true;
    stopAmbientAudio();
    mountView((api) =>
      createPlanLengthView({
        onPlanStarted: () => enterMainApp()
      })
    );
  }

  function renderFactory(step) {
    switch (step.type) {
      case "welcome":
        return createWelcomeView;
      case "age":
        return createAgeView;
      case "habit_detail":
        return (api) => createHabitDetailView({ ...api, habitId: step.habitId });
      case "habit_baseline":
        return (api) =>
          createBaselineView({
            ...api,
            habitId: step.habitId,
            progress: getProgressPercent(getState().currentStep)
          });
      case "life":
        return (api) => createLifeView({ ...api, variant: step.variant });
      case "calculating":
        return createCalculatingView;
      case "stats":
        return (api) => createStatsView({ ...api, phase: step.phase });
      case "adjust":
        return createAdjustHabitsView;
      case "contract":
        return createContractView;
      case "celebration":
        return createCelebrationView;
      case "notifications":
        return createNotificationsView;
      case "plan":
        return (api) =>
          createPlanReadyView({
            ...api,
            onStartPlan: goToPlanLength
          });
      default:
        return createWelcomeView;
    }
  }

  function render({ replace = false, back = false } = {}) {
    choosingPlan = false;
    const { currentStep } = getState();
    const step = getStep(currentStep);
    if (!step) return;

    if (step.type === "welcome") startAmbientAudio();
    else stopAmbientAudio();

    const factory = renderFactory(step);
    if (replace && currentView) {
      clear(host);
      currentView = null;
    }
    mountView(factory, { back });
  }

  function goNext() {
    const { currentStep } = getState();
    if (currentStep >= FLOW.length - 1) {
      goToPlanLength();
      return;
    }
    haptic("medium");
    setStep(currentStep + 1);
    render({ back: false });
  }

  function goBack() {
    if (choosingPlan) {
      choosingPlan = false;
      render({ back: true });
      return;
    }
    const { currentStep } = getState();
    if (currentStep <= 0) return;
    haptic("light");
    setStep(currentStep - 1);
    render({ back: true });
  }

  window.history.pushState({ ikigai: true }, "");
  window.addEventListener("popstate", () => {
    if (hasActivePlan()) return;
    const { currentStep } = getState();
    if (currentStep > 0 || choosingPlan) {
      window.history.pushState({ ikigai: true }, "");
      goBack();
    }
  });

  if (hasUnfinishedOnboarding()) {
    render({ replace: true });
  } else if (!getState().isCompleted) {
    setStep(0);
    render({ replace: true });
  } else if (!hasActivePlan()) {
    // Finished onboarding but never picked plan length
    goToPlanLength();
  } else {
    enterMainApp();
  }

  return { goNext, goBack, render, mode: "onboarding" };
}
