import { ENV } from "../../config/env.js";

/**
 * Map Supabase / network errors to user-friendly messages.
 * Technical details only logged in development.
 */
export function toAuthError(error) {
  const raw = String(error?.message || error || "Unknown error");
  if (ENV.IS_DEV) {
    console.warn("[Ikigai auth]", raw, error);
  }

  const lower = raw.toLowerCase();

  if (!navigator.onLine || lower.includes("failed to fetch") || lower.includes("network")) {
    return {
      code: "offline",
      message: "You’re offline. Check your connection and try again."
    };
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return {
      code: "invalid_credentials",
      message: "Incorrect email or password."
    };
  }
  if (lower.includes("already registered") || lower.includes("user already")) {
    return {
      code: "exists",
      message: "An account with this email already exists. Try logging in."
    };
  }
  if (lower.includes("password") && (lower.includes("weak") || lower.includes("at least"))) {
    return {
      code: "weak_password",
      message: "Password must be at least 6 characters."
    };
  }
  if (lower.includes("valid email") || lower.includes("invalid email")) {
    return {
      code: "invalid_email",
      message: "Please enter a valid email address."
    };
  }
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return {
      code: "email_unverified",
      message: "Please verify your email before signing in. Check your inbox."
    };
  }
  if (lower.includes("rate") || lower.includes("too many")) {
    return {
      code: "rate_limit",
      message: "Too many attempts. Please wait a moment and try again."
    };
  }
  if (lower.includes("session") && lower.includes("expired")) {
    return {
      code: "session_expired",
      message: "Your session expired. Please sign in again."
    };
  }
  if (lower.includes("user not found")) {
    return {
      code: "not_found",
      message: "No account found for that email."
    };
  }

  return {
    code: "unknown",
    message: "Something went wrong. Please try again."
  };
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export function validatePassword(password) {
  return String(password || "").length >= 6;
}
