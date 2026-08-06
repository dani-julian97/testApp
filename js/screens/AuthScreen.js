import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createShell } from "../ui/Shell.js";
import { isCloudEnabled } from "../lib/supabase/client.js";
import {
  signIn,
  signUp,
  resetPassword,
  resendVerification,
  continueAsGuest
} from "../core/authStore.js";
import { toAuthError, validateEmail, validatePassword } from "../services/auth/errors.js";

/**
 * @param {{
 *  mode?: 'login'|'signup'|'reset'|'verify',
 *  onSuccess?: () => void,
 *  onGuest?: () => void,
 *  onBack?: () => void,
 *  presetEmail?: string
 * }} opts
 */
export function createAuthView(opts = {}) {
  let mode = opts.mode || "login";
  let busy = false;
  let message = "";
  let messageTone = "error";

  const emailInput = el("input", {
    className: "auth-input",
    type: "email",
    attrs: {
      placeholder: "Email",
      autocomplete: "email",
      inputmode: "email"
    },
    value: opts.presetEmail || ""
  });

  const passwordInput = el("input", {
    className: "auth-input",
    type: "password",
    attrs: {
      placeholder: "Password",
      autocomplete: "current-password"
    }
  });

  const nameInput = el("input", {
    className: "auth-input",
    type: "text",
    attrs: {
      placeholder: "Display name (optional)",
      autocomplete: "nickname",
      maxlength: "40"
    }
  });

  const status = el("p", { className: "auth-status" });
  const title = el("h1", { className: "screen-title", text: "" });
  const subtitle = el("p", { className: "screen-subtitle", text: "" });
  const formFields = el("div", { className: "auth-fields" });
  const actions = el("div", { className: "auth-actions" });
  const primaryBtn = createButton({ label: "Continue", onClick: () => submit() });

  function setBusy(v) {
    busy = v;
    primaryBtn.disabled = v;
    primaryBtn.textContent = v ? "Please wait…" : primaryLabel();
  }

  function primaryLabel() {
    if (mode === "signup") return "Create account";
    if (mode === "reset") return "Send reset link";
    if (mode === "verify") return "Resend email";
    return "Log in";
  }

  function setMessage(text, tone = "error") {
    message = text || "";
    messageTone = tone;
    status.textContent = message;
    status.dataset.tone = messageTone;
    status.style.display = message ? "block" : "none";
  }

  function rebuild() {
    title.textContent =
      mode === "signup"
        ? "Create account"
        : mode === "reset"
          ? "Reset password"
          : mode === "verify"
            ? "Verify your email"
            : "Welcome back";

    subtitle.textContent =
      mode === "signup"
        ? "Save your plan and sync progress across devices."
        : mode === "reset"
          ? "We’ll email you a link to choose a new password."
          : mode === "verify"
            ? "Check your inbox, then come back to log in."
            : "Log in to restore your Ikigai plan.";

    formFields.replaceChildren();
    if (mode === "signup") formFields.append(nameInput);
    if (mode !== "verify") formFields.append(emailInput);
    if (mode === "login" || mode === "signup") {
      passwordInput.attrs = passwordInput.attrs || {};
      passwordInput.setAttribute(
        "autocomplete",
        mode === "signup" ? "new-password" : "current-password"
      );
      passwordInput.placeholder =
        mode === "signup" ? "Password (min. 6 characters)" : "Password";
      formFields.append(passwordInput);
    }
    if (mode === "verify") {
      formFields.append(emailInput);
    }

    primaryBtn.textContent = primaryLabel();

    actions.replaceChildren();
    actions.append(primaryBtn);

    if (mode === "login") {
      actions.append(
        createButton({
          label: "Create account",
          variant: "ghost",
          onClick: () => {
            mode = "signup";
            setMessage("");
            rebuild();
          }
        }),
        createButton({
          label: "Forgot password?",
          variant: "ghost",
          onClick: () => {
            mode = "reset";
            setMessage("");
            rebuild();
          }
        })
      );
    } else if (mode === "signup") {
      actions.append(
        createButton({
          label: "Already have an account? Log in",
          variant: "ghost",
          onClick: () => {
            mode = "login";
            setMessage("");
            rebuild();
          }
        })
      );
    } else {
      actions.append(
        createButton({
          label: "Back to log in",
          variant: "ghost",
          onClick: () => {
            mode = "login";
            setMessage("");
            rebuild();
          }
        })
      );
    }

    if (!isCloudEnabled()) {
      setMessage(
        "Cloud sync isn’t configured. Deploy env.public.js with your Project URL and anon key.",
        "info"
      );
    }
  }

  async function submit() {
    if (busy) return;
    if (!isCloudEnabled()) {
      setMessage(
        "Cloud sync isn’t configured. Deploy env.public.js with your Project URL and anon key.",
        "info"
      );
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      setBusy(true);
      setMessage("");

      if (mode === "reset") {
        if (!validateEmail(email)) {
          setMessage("Please enter a valid email address.");
          return;
        }
        await resetPassword(email);
        setMessage("Reset link sent. Check your email.", "success");
        return;
      }

      if (mode === "verify") {
        if (!validateEmail(email)) {
          setMessage("Please enter a valid email address.");
          return;
        }
        await resendVerification(email);
        setMessage("Verification email sent.", "success");
        return;
      }

      if (!validateEmail(email)) {
        setMessage("Please enter a valid email address.");
        return;
      }
      if (!validatePassword(password)) {
        setMessage("Password must be at least 6 characters.");
        return;
      }

      if (mode === "signup") {
        const data = await signUp(email, password, {
          display_name: nameInput.value.trim() || undefined
        });
        if (!data.session) {
          mode = "verify";
          rebuild();
          setMessage(
            "Account created. Verify your email, then log in. Your local progress will sync after sign-in.",
            "success"
          );
          return;
        }
        opts.onSuccess?.();
        return;
      }

      await signIn(email, password);
      opts.onSuccess?.();
    } catch (error) {
      const friendly = error.code ? error : toAuthError(error);
      setMessage(friendly.message || "Something went wrong.");
      if (friendly.code === "email_unverified") {
        mode = "verify";
        rebuild();
      }
    } finally {
      setBusy(false);
    }
  }

  rebuild();
  setMessage("");

  const body = el("div", { className: "auth-screen fade-in" }, [
    title,
    subtitle,
    status,
    formFields,
    actions,
    createButton({
      label: "Continue as guest",
      variant: "ghost",
      onClick: () => {
        continueAsGuest();
        opts.onGuest?.();
      }
    }),
    opts.onBack
      ? createButton({
          label: "Back",
          variant: "ghost",
          onClick: opts.onBack
        })
      : null
  ]);

  return createShell({ body });
}
