import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createShell } from "../ui/Shell.js";
import { iconSvg } from "../ui/icons.js";
import { setNotificationsEnabled } from "../core/store.js";

export function createNotificationsView({ goNext }) {
  const body = el("div", { className: "notify fade-in" }, [
    el("div", {
      className: "notify__icon",
      html: iconSvg("bell", { size: 64 })
    }),
    el("h1", { className: "screen-title", text: "Stay On Track" }),
    el("p", {
      className: "screen-subtitle",
      text: "Get daily reminders to complete your habits and build consistency"
    })
  ]);

  async function enable() {
    setNotificationsEnabled(true);
    try {
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
    } catch {
      /* ignore */
    }
    goNext();
  }

  return createShell({
    centered: true,
    body,
    footer: el("div", {}, [
      createButton({
        label: "Enable Notifications",
        onClick: enable
      }),
      el("button", {
        className: "btn btn--ghost btn--block",
        type: "button",
        text: "Skip for now",
        events: {
          click: () => {
            setNotificationsEnabled(false);
            goNext();
          }
        }
      })
    ])
  });
}
