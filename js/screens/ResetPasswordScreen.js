import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createShell } from "../ui/Shell.js";
import { updatePassword } from "../core/authStore.js";
import { toAuthError, validatePassword } from "../services/auth/errors.js";

export function createResetPasswordView({ onDone, onCancel } = {}) {
  let busy = false;
  const passwordInput = el("input", {
    className: "auth-input",
    type: "password",
    attrs: {
      placeholder: "New password (min. 6 characters)",
      autocomplete: "new-password"
    }
  });
  const confirmInput = el("input", {
    className: "auth-input",
    type: "password",
    attrs: {
      placeholder: "Confirm new password",
      autocomplete: "new-password"
    }
  });
  const status = el("p", { className: "auth-status", style: "display:none;" });
  const saveBtn = createButton({
    label: "Save new password",
    onClick: async () => {
      if (busy) return;
      const password = passwordInput.value;
      if (!validatePassword(password)) {
        status.style.display = "block";
        status.dataset.tone = "error";
        status.textContent = "Password must be at least 6 characters.";
        return;
      }
      if (password !== confirmInput.value) {
        status.style.display = "block";
        status.dataset.tone = "error";
        status.textContent = "Passwords do not match.";
        return;
      }
      try {
        busy = true;
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving…";
        await updatePassword(password);
        status.style.display = "block";
        status.dataset.tone = "success";
        status.textContent = "Password updated.";
        window.setTimeout(() => onDone?.(), 700);
      } catch (error) {
        status.style.display = "block";
        status.dataset.tone = "error";
        status.textContent = toAuthError(error).message;
      } finally {
        busy = false;
        saveBtn.disabled = false;
        saveBtn.textContent = "Save new password";
      }
    }
  });

  const body = el("div", { className: "auth-screen fade-in" }, [
    el("h1", { className: "screen-title", text: "Choose a new password" }),
    el("p", {
      className: "screen-subtitle",
      text: "You’re signed in via the reset link. Set a new password to continue."
    }),
    status,
    el("div", { className: "auth-fields" }, [passwordInput, confirmInput]),
    saveBtn,
    createButton({
      label: "Cancel",
      variant: "ghost",
      onClick: () => onCancel?.()
    })
  ]);

  return createShell({ body });
}

export function isPasswordRecoveryRedirect() {
  const hash = window.location.hash || "";
  const search = window.location.search || "";
  return (
    hash.includes("type=recovery") ||
    hash.includes("recovery") ||
    search.includes("type=recovery")
  );
}
