import { isCloudEnabled } from "../lib/supabase/client.js";
import * as authService from "../services/auth/authService.js";
import { getProfile } from "../services/profile/profileService.js";
import {
  pullRemoteState,
  pushLocalState,
  mergeLocalAndRemote,
  flushPendingQueue
} from "../services/sync/syncService.js";
import { getState, replaceState, getStateSnapshot } from "./store.js";
import { toAuthError } from "../services/auth/errors.js";

const listeners = new Set();

/** @type {{
 *  user: object|null,
 *  session: object|null,
 *  profile: object|null,
 *  isLoading: boolean,
 *  isAuthenticated: boolean,
 *  isGuest: boolean,
 *  emailVerified: boolean,
 *  lastError: string|null,
 *  syncStatus: 'idle'|'syncing'|'error'|'ok'
 * }} */
let authState = {
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  isGuest: true,
  emailVerified: false,
  lastError: null,
  syncStatus: "idle"
};

function emit() {
  listeners.forEach((fn) => fn(authState));
}

function setAuth(patch) {
  authState = { ...authState, ...patch };
  emit();
}

export function getAuthState() {
  return authState;
}

export function subscribeAuth(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function applySession(session) {
  const user = session?.user ?? null;
  const emailVerified = Boolean(
    user?.email_confirmed_at || user?.confirmed_at
  );
  setAuth({
    session: session ?? null,
    user,
    isAuthenticated: Boolean(user),
    isGuest: !user,
    emailVerified,
    isLoading: false
  });
}

/**
 * Initialize auth before navigation. Shows loading until done.
 */
export async function initAuth() {
  setAuth({ isLoading: true, lastError: null });

  if (!isCloudEnabled()) {
    setAuth({
      isLoading: false,
      isAuthenticated: false,
      isGuest: true,
      user: null,
      session: null
    });
    return authState;
  }

  try {
    // Handle recovery / invite links in URL hash
    await authService.getSession();
    const session = await authService.getSession();
    applySession(session);

    if (session?.user) {
      await hydrateFromCloud({ migrateGuest: true });
    }

    authService.onAuthStateChange(async (event, session) => {
      applySession(session);
      if (event === "SIGNED_IN" && session?.user) {
        await hydrateFromCloud({ migrateGuest: true });
      }
      if (event === "SIGNED_OUT") {
        setAuth({ profile: null, isGuest: true, isAuthenticated: false });
      }
    });

    window.addEventListener("online", () => {
      flushPendingQueue(() => getState());
    });
  } catch (error) {
    const friendly = toAuthError(error);
    setAuth({
      isLoading: false,
      lastError: friendly.message,
      isGuest: true,
      isAuthenticated: false
    });
  }

  return authState;
}

/**
 * Pull remote, merge with local guest data, push merged result.
 */
export async function hydrateFromCloud({ migrateGuest = false } = {}) {
  if (!authState.isAuthenticated) return;
  setAuth({ syncStatus: "syncing" });
  try {
    const remote = await pullRemoteState();
    const local = getStateSnapshot();
    const merged = mergeLocalAndRemote(local, remote);
    replaceState(merged);

    if (migrateGuest || remote?.hasCloudData) {
      await pushLocalState(getState());
    }

    const profile = await getProfile();
    setAuth({ profile, syncStatus: "ok", lastError: null });
  } catch (error) {
    setAuth({
      syncStatus: "error",
      lastError: toAuthError(error).message
    });
  }
}

export async function signUp(email, password, profile) {
  setAuth({ lastError: null });
  const data = await authService.signUp(email, password, profile);
  // Session may be null if email confirmation required
  if (data.session) {
    applySession(data.session);
    await hydrateFromCloud({ migrateGuest: true });
  } else if (data.user) {
    setAuth({
      user: data.user,
      isAuthenticated: false,
      isGuest: true,
      emailVerified: false,
      lastError: null
    });
  }
  return data;
}

export async function signIn(email, password) {
  setAuth({ lastError: null });
  const data = await authService.signIn(email, password);
  applySession(data.session);
  await hydrateFromCloud({ migrateGuest: true });
  return data;
}

export async function signOut({ clearLocalData = false } = {}) {
  await authService.signOut();
  applySession(null);
  setAuth({ profile: null, isGuest: true });
  // Do not erase guest/local progress unless explicitly requested
  if (clearLocalData) {
    const { resetOnboarding } = await import("./store.js");
    resetOnboarding();
  }
}

export async function resetPassword(email) {
  return authService.resetPassword(email);
}

export async function updatePassword(password) {
  return authService.updatePassword(password);
}

export async function resendVerification(email) {
  return authService.resendVerification(email);
}

export async function convertGuestToAccount(email, password, profile) {
  const data = await authService.convertGuestToAccount(email, password, profile);
  if (data.session) {
    applySession(data.session);
    await pushLocalState(getState());
    await hydrateFromCloud({ migrateGuest: true });
  }
  return data;
}

export async function deleteAccount() {
  await authService.deleteAccount();
  applySession(null);
  setAuth({ profile: null, isGuest: true });
}

export function continueAsGuest() {
  setAuth({
    isGuest: true,
    isAuthenticated: false,
    user: null,
    session: null,
    isLoading: false
  });
}

export const auth = {
  getState: getAuthState,
  subscribe: subscribeAuth,
  init: initAuth,
  signUp,
  signIn,
  signOut,
  resetPassword,
  updatePassword,
  resendVerification,
  convertGuestToAccount,
  deleteAccount,
  continueAsGuest,
  hydrateFromCloud
};
