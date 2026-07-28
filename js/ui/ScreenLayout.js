import { el } from "./dom.js";
import { createIconButton } from "./Button.js";
import { createProgressBar } from "./ProgressBar.js";

const BACK_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';

/**
 * Shared light-screen chrome used by quiz + auth.
 */
export function createScreenLayout({
  showBack = false,
  onBack,
  progress,
  body,
  footer
} = {}) {
  const headerKids = [];

  if (showBack) {
    headerKids.push(
      createIconButton({
        label: "Go back",
        onClick: onBack,
        svg: BACK_SVG
      })
    );
  }

  let progressApi = null;
  if (progress) {
    progressApi = createProgressBar(progress);
    headerKids.push(progressApi.el);
  } else if (showBack) {
    headerKids.push(el("div", { style: "flex:1;" }));
  }

  const shell = el("div", { className: "shell shell--light" }, [
    headerKids.length
      ? el("header", { className: "shell__header" }, headerKids)
      : null,
    el("div", { className: "shell__body" }, [body]),
    footer ? el("footer", { className: "shell__footer" }, [footer]) : null
  ]);

  return {
    el: shell,
    progress: progressApi
  };
}
