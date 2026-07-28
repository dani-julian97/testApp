import { el, clear } from "../ui/dom.js";
import { iconSvg } from "../ui/icons.js";
import {
  getState,
  setMainTab,
  setSelectedDate,
  toggleHabitCompletion,
  isHabitDone,
  dayCompletionRatio,
  addJournalEntry,
  subscribe
} from "../core/store.js";
import { getHabit, formatHabitProgress } from "../data/habits.js";
import { TROPHIES, getRank, trophiesForHabit } from "../data/trophies.js";
import { createButton } from "../ui/Button.js";
import { haptic } from "../core/haptics.js";
import { createAddHabitView } from "./AddHabitScreen.js";

const TABS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "journal", label: "Journal", icon: "journal" },
  { id: "progress", label: "Progress", icon: "progress" },
  { id: "block", label: "Block", icon: "block" },
  { id: "trophies", label: "Trophies", icon: "trophy" }
];

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function dateKeyFromDate(d) {
  return d.toISOString().slice(0, 10);
}

function weekDates(aroundKey) {
  const center = new Date(aroundKey + "T12:00:00");
  const start = new Date(center);
  start.setDate(center.getDate() - 3);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function dayOfYear(dateKey) {
  const d = new Date(dateKey + "T12:00:00");
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

export function startMainApp(root) {
  clear(root);

  const content = el("div", { className: "main-app__content" });
  const pageHost = el("div", { className: "main-app__page" });
  content.append(pageHost);

  const tabbar = el(
    "nav",
    { className: "tabbar", attrs: { "aria-label": "Main" } },
    TABS.map((tab) =>
      el(
        "button",
        {
          className: "tabbar__item",
          type: "button",
          dataset: { tab: tab.id },
          events: {
            click: () => {
              setMainTab(tab.id);
              haptic("light");
              render();
            }
          }
        },
        [
          el("span", { html: iconSvg(tab.icon, { size: 22 }) }),
          el("span", { text: tab.label })
        ]
      )
    )
  );

  const fab = el("button", {
    className: "fab-add",
    type: "button",
    attrs: { "aria-label": "Add habit" },
    html: iconSvg("plus", { size: 22 }),
    events: {
      click: () => {
        haptic("light");
        showAddHabit();
      }
    }
  });

  const app = el("div", { className: "main-app screen is-active" }, [
    content,
    fab,
    tabbar
  ]);
  root.append(app);

  let unsub = subscribe(() => {
    /* store already saved; render on explicit actions */
  });

  function syncTabs() {
    const active = getState().mainTab;
    tabbar.querySelectorAll(".tabbar__item").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.tab === active);
    });
    fab.style.display = active === "home" ? "grid" : "none";
  }

  function showAddHabit() {
    const overlay = el("div", {
      className: "screen is-active",
      style: "z-index:40;background:#000;"
    });
    const view = createAddHabitView({
      onDone: () => {
        overlay.remove();
        render();
      },
      onCancel: () => overlay.remove()
    });
    overlay.append(view);
    root.append(overlay);
  }

  function renderHome() {
    const state = getState();
    const dates = weekDates(state.selectedDate);
    let mode = "habits";

    const feed = el("div", { className: "habit-feed" });

    function renderFeed() {
      clear(feed);
      if (mode === "goals") {
        feed.append(
          el("p", {
            className: "hint-label",
            text: "Goals coming soon — track habits for now.",
            style: "text-align:center;padding:2rem 0;"
          })
        );
        return;
      }
      state.selectedHabitIds.forEach((id) => {
        const habit = getHabit(id);
        if (!habit) return;
        const done = isHabitDone(id, state.selectedDate);
        const row = el(
          "button",
          {
            className: `habit-row${done ? " is-done" : ""}`,
            type: "button",
            style: `--habit-color:${habit.color}`,
            events: {
              click: () => {
                toggleHabitCompletion(id);
                haptic(done ? "light" : "medium");
                render();
              }
            }
          },
          [
            el("div", {
              className: "habit-row__bg",
              attrs: { "data-tone": habit.imageTone || "calm", "aria-hidden": "true" }
            }),
            el("div", {
              className: "habit-row__check",
              html: iconSvg("check", { size: 14 })
            }),
            el("div", { className: "habit-row__text" }, [
              el("div", { className: "habit-row__title", text: habit.title }),
              el("div", {
                className: "habit-row__meta",
                text: formatHabitProgress(habit, done)
              })
            ]),
            el("div", {
              className: "habit-row__icon",
              html: iconSvg(habit.icon, { size: 18 })
            })
          ]
        );
        feed.append(row);
      });
    }

    const segmented = el("div", { className: "segmented" }, [
      el("button", {
        className: "segmented__btn is-active",
        type: "button",
        text: "Habits",
        events: {
          click: (e) => {
            mode = "habits";
            segmented.querySelectorAll(".segmented__btn").forEach((b) =>
              b.classList.remove("is-active")
            );
            e.currentTarget.classList.add("is-active");
            renderFeed();
          }
        }
      }),
      el("button", {
        className: "segmented__btn",
        type: "button",
        text: "Goals",
        events: {
          click: (e) => {
            mode = "goals";
            segmented.querySelectorAll(".segmented__btn").forEach((b) =>
              b.classList.remove("is-active")
            );
            e.currentTarget.classList.add("is-active");
            renderFeed();
          }
        }
      })
    ]);

    const strip = el(
      "div",
      { className: "week-strip", attrs: { role: "listbox", "aria-label": "Week" } },
      dates.map((d) => {
        const key = dateKeyFromDate(d);
        const ratio = dayCompletionRatio(key);
        const selected = key === state.selectedDate;
        return el(
          "button",
          {
            className: `week-day${selected ? " is-selected" : ""}${
              ratio >= 1 ? " is-complete" : ""
            }`,
            type: "button",
            attrs: { role: "option", "aria-selected": selected ? "true" : "false" },
            events: {
              click: () => {
                setSelectedDate(key);
                haptic("light");
                render();
              }
            }
          },
          [
            el("span", { text: WEEKDAYS[d.getDay()] }),
            el("span", { className: "week-day__num", text: String(d.getDate()) })
          ]
        );
      })
    );

    renderFeed();

    return el("div", { className: "fade-in" }, [
      el("h1", { className: "todo-title", text: "To-Do" }),
      strip,
      segmented,
      feed
    ]);
  }

  function renderProgress() {
    const state = getState();
    const year = new Date(state.selectedDate + "T12:00:00").getFullYear();
    const todayIndex = dayOfYear(state.selectedDate);

    const cards = state.selectedHabitIds.map((id) => {
      const habit = getHabit(id);
      if (!habit) return null;

      const cells = [];
      for (let i = 1; i <= 365; i++) {
        const d = new Date(year, 0, i);
        const key = dateKeyFromDate(d);
        const done = Boolean(state.completions[key]?.[id]);
        const future = i > todayIndex;
        cells.push(
          el("div", {
            className: `year-grid__cell${done ? " is-done" : ""}${
              future ? " is-future" : ""
            }`
          })
        );
      }

      return el(
        "div",
        {
          className: "progress-card",
          style: `--habit-color:${habit.color}`
        },
        [
          el("div", { className: "progress-card__head" }, [
            el("div", { className: "progress-card__habit" }, [
              el("span", { className: "progress-card__dot" }),
              el("span", { text: habit.title })
            ]),
            el("div", { className: "progress-card__year" }, [
              el("span", { text: String(year) })
            ])
          ]),
          el("div", { className: "year-grid" }, cells)
        ]
      );
    });

    return el("div", { className: "fade-in" }, [
      el("h1", { className: "progress-page__title", text: "Progress" }),
      el("h2", {
        className: "hint-label",
        text: "Habits",
        style: "font-size:1.1rem;color:#fff;margin-bottom:1rem;"
      }),
      ...cards.filter(Boolean)
    ]);
  }

  function renderJournal() {
    const state = getState();
    const list = el("div", { className: "journal-list" });

    function refreshList() {
      clear(list);
      const entries = getState().journalEntries;
      if (!entries.length) {
        list.append(
          el("p", {
            className: "hint-label",
            text: "No entries yet. Write your first reflection.",
            style: "text-align:center;padding:1rem 0;"
          })
        );
        return;
      }
      entries.forEach((entry) => {
        list.append(
          el("article", { className: "journal-item" }, [
            el("div", { className: "journal-item__date", text: entry.date }),
            el("div", { className: "journal-item__text", text: entry.text })
          ])
        );
      });
    }

    const textarea = el("textarea", {
      attrs: { placeholder: "How are you feeling today?", rows: "4" }
    });

    const composer = el("div", { className: "journal-composer" }, [
      textarea,
      createButton({
        label: "Save entry",
        onClick: () => {
          if (!textarea.value.trim()) return;
          addJournalEntry(textarea.value);
          textarea.value = "";
          haptic("medium");
          refreshList();
        }
      })
    ]);

    refreshList();

    return el("div", { className: "fade-in" }, [
      el("h1", { className: "todo-title", text: "Journal" }),
      composer,
      list
    ]);
  }

  function renderBlock() {
    return el("div", { className: "block-empty fade-in" }, [
      el("div", {
        className: "block-empty__icon",
        html: iconSvg("block", { size: 56 })
      }),
      el("h1", { className: "screen-title", text: "Block" }),
      el("p", {
        className: "screen-subtitle",
        text: "App blocking is coming soon."
      })
    ]);
  }

  function renderTrophies() {
    const state = getState();
    const unlocked = new Set(state.unlockedTrophies || []);
    const rank = getRank(state.xp || 0);

    const sections = [];
    const byHabit = new Map();
    TROPHIES.forEach((t) => {
      const key = t.habitId || "global";
      if (!byHabit.has(key)) byHabit.set(key, []);
      byHabit.get(key).push(t);
    });

    // Prefer selected habits first
    const order = [
      ...state.selectedHabitIds,
      ...[...byHabit.keys()].filter(
        (k) => k !== "global" && !state.selectedHabitIds.includes(k)
      ),
      "global"
    ];

    order.forEach((habitId) => {
      const list = byHabit.get(habitId);
      if (!list?.length) return;
      const habit = habitId === "global" ? null : getHabit(habitId);
      const title =
        habitId === "global"
          ? "General"
          : habit?.title || trophiesForHabit(habitId)[0]?.title || habitId;

      sections.push(
        el("section", { className: "trophy-section" }, [
          el("h2", { className: "trophy-section__title", text: title }),
          el(
            "div",
            { className: "trophy-grid" },
            list.map((trophy) =>
              el(
                "div",
                {
                  className: `trophy-item${
                    unlocked.has(trophy.id) ? " is-unlocked" : ""
                  }`
                },
                [
                  el("div", {
                    className: "trophy-item__icon",
                    html: iconSvg(trophy.icon, { size: 28 })
                  }),
                  el("div", {
                    className: "trophy-item__title",
                    text: trophy.title
                  })
                ]
              )
            )
          )
        ])
      );
    });

    return el("div", { className: "fade-in" }, [
      el("h1", {
        className: "progress-page__title",
        text: "Trophies"
      }),
      el("div", { className: "trophies-head" }, [
        el("div", { className: "trophies-rank" }, [
          el("span", { html: iconSvg("crown", { size: 18 }) }),
          el("span", { text: `Rank: ${rank}` })
        ]),
        el("div", {
          className: "trophies-sub",
          text: `${(state.xp || 0).toLocaleString()} XP`
        }),
        el("div", {
          className: "trophies-count",
          text: `${unlocked.size}/${TROPHIES.length}`
        }),
        el("div", { className: "trophies-sub", text: "UNLOCKED" })
      ]),
      ...sections
    ]);
  }

  function render() {
    syncTabs();
    clear(pageHost);
    const tab = getState().mainTab;
    let page;
    if (tab === "progress") page = renderProgress();
    else if (tab === "journal") page = renderJournal();
    else if (tab === "block") page = renderBlock();
    else if (tab === "trophies") page = renderTrophies();
    else page = renderHome();
    pageHost.append(page);
  }

  render();

  return {
    destroy() {
      unsub?.();
      app.remove();
    },
    render
  };
}
