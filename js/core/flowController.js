import { el, clear } from "../ui/dom.js";
import { FLOW, getStep, getProgressPercent } from "../data/flow.js";
import {
  getState,
  setStep,
  hasUnfinishedOnboarding,
  hasActivePlan
} from "./store.js";
import { initAuth, getAuthState } from "./authStore.js";
import { createButton } from "../ui/Button.js";
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
import { createAuthView } from "../screens/AuthScreen.js";
import {
  createResetPasswordView,
  isPasswordRecoveryRedirect,
  isEmailConfirmRedirect,
  clearAuthRedirectFromUrl
} from "../screens/ResetPasswordScreen.js";
import { startAmbientAudio, stopAmbientAudio } from "./audio.js";
import { startMainApp } from "../app/MainApp.js";

function showSplash(root) {
  clear(root);
  root.append(
    el("div", { className: "auth-splash" }, [
      el("div", { className: "auth-splash__mark", text: "Ikigai" }),
      el("p", { className: "auth-splash__copy", text: "Loading your space…" }),
      el("div", { className: "auth-splash__spinner", attrs: { "aria-hidden": "true" } })
    ])
  );
}

function showConfirmSuccess(root, onContinue) {
  clear(root);
  root.append(
    el("div", { className: "auth-splash" }, [
      el("div", { className: "auth-splash__mark", text: "Email confirmed" }),
      el("p", {
        className: "auth-splash__copy",
        text: "You’re verified. Continuing into Ikigai…"
      }),
      createButton({
        label: "Continue",
        onClick: onContinue
      })
    ])
  );
}

export async function startApp(root) {
  try {
    showSplash(root);
    await initAuth();

    if (isPasswordRecoveryRedirect()) {
      clearAuthRedirectFromUrl();
      clear(root);
      root.append(
        createResetPasswordView({
          onDone: () => {
            clearAuthRedirectFromUrl();
            routeAfterAuth(root);
          },
          onCancel: () => {
            clearAuthRedirectFromUrl();
            routeAfterAuth(root);
          }
        })
      );
      return { mode: "recovery" };
    }

    if (isEmailConfirmRedirect()) {
      const auth = getAuthState();
      clearAuthRedirectFromUrl();
      if (auth.isAuthenticated) {
        showConfirmSuccess(root, () => routeAfterAuth(root));
        window.setTimeout(() => routeAfterAuth(root), 1200);
        return { mode: "email_confirmed" };
      }
    }

    return routeAfterAuth(root);
  } catch (error) {
    console.error("Failed to start app:", error);
    root.innerHTML =
      '<div style="padding:2rem;font-family:system-ui,sans-serif;color:#fff;background:#000;min-height:100dvh;">' +
      "<h1 style=\"margin-bottom:0.75rem;\">Something went wrong</h1>" +
      "<p style=\"color:#9a9a9a;line-height:1.5;margin-bottom:1rem;\">Please refresh. If it keeps happening, clear site data.</p>" +
      "<pre style=\"color:#f87171;white-space:pre-wrap;font-size:12px;\">" +
      String(error && error.message ? error.message : error) +
      "</pre></div>";
    return { mode: "error" };
  }
}

function routeAfterAuth(root) {
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
  let authOverlay = null;

  function mountView(factory, { back = false } = {}) {
    if (animLock) return;
    animLock = true;

    const nextEl = factory({
      goNext,
      goBack,
      refresh: () => render({ replace: true }),
      goToPlanLength,
      enterMainApp,
      openAuth
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

  function closeAuthOverlay() {
    authOverlay?.remove();
    authOverlay = null;
  }

  function openAuth(mode = "login") {
    closeAuthOverlay();
    authOverlay = el("div", {
      className: "screen is-active auth-overlay",
      style: "z-index:50;background:#000;"
    });
    const view = createAuthView({
      mode,
      onBack: closeAuthOverlay,
      onGuest: () => {
        closeAuthOverlay();
        if (getState().currentStep === 0) goNext();
      },
      onSuccess: () => {
        closeAuthOverlay();
        if (hasActivePlan()) {
          enterMainApp();
          return;
        }
        render({ replace: true });
      }
    });
    authOverlay.append(view);
    root.append(authOverlay);
  }

  function enterMainApp() {
    stopAmbientAudio();
    try {
      startMainApp(root);
    } catch (error) {
      console.error("Failed to open main app:", error);
      root.innerHTML =
        '<div style="padding:2rem;font-family:system-ui,sans-serif;color:#fff;background:#000;min-height:100dvh;">' +
        "<h1 style=\"margin-bottom:0.75rem;\">Could not open the app</h1>" +
        "<p style=\"color:#9a9a9a;\">" +
        String(error && error.message ? error.message : error) +
        "</p></div>";
    }
  }

  function goToPlanLength() {
    choosingPlan = true;
    stopAmbientAudio();
    mountView(() =>
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

  // Avoid wrong stack flash: auth already initialized before this runs
  void getAuthState();

  if (hasUnfinishedOnboarding()) {
    render({ replace: true });
  } else if (!getState().isCompleted) {
    setStep(0);
    render({ replace: true });
  } else if (!hasActivePlan()) {
    goToPlanLength();
  } else {
    enterMainApp();
  }

  return { goNext, goBack, render, mode: "onboarding", openAuth };
}
