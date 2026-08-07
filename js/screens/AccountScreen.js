import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createShell } from "../ui/Shell.js";
import { getState, getPlanDayNumber } from "../core/store.js";
import {
  getAuthState,
  signOut,
  convertGuestToAccount,
  deleteAccount,
  resetPassword,
  subscribeAuth
} from "../core/authStore.js";
import { updateProfile } from "../services/profile/profileService.js";
import { isCloudEnabled } from "../lib/supabase/client.js";
import { toAuthError, validateEmail, validatePassword } from "../services/auth/errors.js";
import { getPlanDuration, formatPathLabel } from "../data/progress.js";
import { haptic } from "../core/haptics.js";

/**
 * @param {{ onBack?: () => void, onSignedOut?: () => void }} opts
 */
export function createAccountView(opts = {}) {
  const status = el("p", { className: "auth-status", style: "display:none;" });

  function showStatus(text, tone = "error") {
    status.style.display = text ? "block" : "none";
    status.dataset.tone = tone;
    status.textContent = text || "";
  }

  function build() {
    const auth = getAuthState();
    const app = getState();
    const duration = getPlanDuration(app);
    const planDay = getPlanDayNumber();

    const email = auth.user?.email || auth.profile?.email || "—";
    const displayName =
      auth.profile?.display_name ||
      auth.user?.user_metadata?.display_name ||
      (auth.isGuest ? "Guest" : email.split("@")[0]);

    const nameInput = el("input", {
      className: "auth-input",
      type: "text",
      value: auth.isGuest ? "" : displayName === "Guest" ? "" : displayName,
      attrs: {
        placeholder: "Display name",
        maxlength: "40",
        disabled: auth.isGuest || !isCloudEnabled() ? "true" : undefined
      }
    });

    const convertEmail = el("input", {
      className: "auth-input",
      type: "email",
      attrs: { placeholder: "Email", autocomplete: "email" }
    });
    const convertPassword = el("input", {
      className: "auth-input",
      type: "password",
      attrs: { placeholder: "Password (min. 6)", autocomplete: "new-password" }
    });

    const rows = el("div", { className: "account-rows" }, [
      row("Status", auth.isAuthenticated ? "Registered" : "Guest"),
      row("Email", email),
      row("Path", app.planDays ? formatPathLabel(duration) : "Not started"),
      row("Started", app.planStartDate || "—"),
      row("Current day", app.planDays ? String(planDay) : "—"),
      row(
        "Cloud sync",
        !isCloudEnabled()
          ? "Not configured"
          : auth.syncStatus === "syncing"
            ? "Syncing…"
            : auth.isAuthenticated
              ? "On"
              : "Local only"
      )
    ]);

    const sections = [
      el("h1", { className: "screen-title", text: "Account" }),
      el("p", {
        className: "screen-subtitle",
        text: auth.isGuest
          ? "You’re using Ikigai as a guest. Create an account anytime — your progress stays."
          : "Manage your profile and cloud sync."
      }),
      status,
      rows
    ];

    if (auth.isAuthenticated && isCloudEnabled()) {
      sections.push(
        el("h2", { className: "account-section-title", text: "Profile" }),
        nameInput,
        createButton({
          label: "Save profile",
          onClick: async () => {
            try {
              showStatus("Saving…", "info");
              const profile = await updateProfile({
                display_name: nameInput.value.trim() || displayName
              });
              showStatus("Profile updated.", "success");
              haptic("success");
              return profile;
            } catch (error) {
              showStatus(toAuthError(error).message);
            }
          }
        }),
        createButton({
          label: "Send password reset email",
          variant: "ghost",
          onClick: async () => {
            try {
              await resetPassword(email);
              showStatus("Reset email sent.", "success");
            } catch (error) {
              showStatus(toAuthError(error).message);
            }
          }
        }),
        createButton({
          label: "Log out",
          variant: "ghost",
          onClick: async () => {
            await signOut({ clearLocalData: false });
            haptic("light");
            opts.onSignedOut?.();
          }
        }),
        createButton({
          label: "Delete account",
          variant: "ghost",
          className: "btn--danger",
          onClick: async () => {
            const ok = window.confirm(
              "Delete your Ikigai account and cloud data? This cannot be undone. Local guest data on this device is kept unless you clear site data."
            );
            if (!ok) return;
            const again = window.confirm("Really delete your account?");
            if (!again) return;
            try {
              showStatus("Deleting account…", "info");
              await deleteAccount();
              showStatus("Account deleted.", "success");
              opts.onSignedOut?.();
            } catch (error) {
              showStatus(
                toAuthError(error).message +
                  " (Deploy the delete-account Edge Function if missing.)"
              );
            }
          }
        })
      );
    }

    if (auth.isGuest) {
      sections.push(
        el("h2", { className: "account-section-title", text: "Save your progress" }),
        el("p", {
          className: "hint-label",
          text: isCloudEnabled()
            ? "Create an account to sync across devices. Your current progress will be uploaded."
            : "Configure Supabase (env.local.js) to enable cloud accounts."
        }),
        convertEmail,
        convertPassword,
        createButton({
          label: "Create account & keep progress",
          onClick: async () => {
            if (!isCloudEnabled()) {
              showStatus("Cloud is not configured.", "info");
              return;
            }
            const emailVal = convertEmail.value.trim();
            const pass = convertPassword.value;
            if (!validateEmail(emailVal)) {
              showStatus("Please enter a valid email.");
              return;
            }
            if (!validatePassword(pass)) {
              showStatus("Password must be at least 6 characters.");
              return;
            }
            try {
              showStatus("Creating account…", "info");
              const data = await convertGuestToAccount(emailVal, pass, {
                display_name: nameInput.value.trim() || undefined
              });
              if (!data.session) {
                showStatus(
                  "Account created. Verify your email, then log in — progress stays on this device until then.",
                  "success"
                );
                return;
              }
              showStatus("Account ready. Progress synced.", "success");
              haptic("success");
              rebuildHost();
            } catch (error) {
              showStatus(toAuthError(error).message);
            }
          }
        })
      );
    }

    sections.push(
      createButton({
        label: "Back",
        variant: "ghost",
        onClick: () => opts.onBack?.()
      })
    );

    return el("div", { className: "account-screen fade-in" }, sections);
  }

  const host = el("div");
  function rebuildHost() {
    host.replaceChildren(build());
  }
  rebuildHost();
  const unsub = subscribeAuth(() => rebuildHost());

  const shell = createShell({ body: host });
  shell.addEventListener(
    "remove",
    () => {
      unsub();
    },
    { once: true }
  );
  // Fallback cleanup when parent clears
  const obs = new MutationObserver(() => {
    if (!document.body.contains(shell)) {
      unsub();
      obs.disconnect();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });

  return shell;
}

function row(label, value) {
  return el("div", { className: "account-row" }, [
    el("span", { className: "account-row__label", text: label }),
    el("span", { className: "account-row__value", text: String(value) })
  ]);
}
