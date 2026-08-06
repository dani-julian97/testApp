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
  addTask,
  toggleTask,
  deleteTask,
  subscribe
} from "../core/store.js";
import { getHabit, formatHabitProgress } from "../data/habits.js";
import { getHabitImageSrc, preloadHabitImages } from "../data/habitImages.js";
import {
  getDailyProgress,
  getPlanDayCircles,
  getPlanDuration,
  getPolygonValuesForDate,
  getOverallPlanCompletion,
  deriveAspectScores
} from "../data/progress.js";
import { TROPHIES, getRank, trophiesForHabit } from "../data/trophies.js";
import { ASPECT_KEYS, ASPECT_LABELS, aspectColor } from "../data/aspects.js";
import { createButton } from "../ui/Button.js";
import { createRadarChart } from "../ui/RadarChart.js";
import { haptic } from "../core/haptics.js";
import { createAddHabitView } from "../screens/AddHabitScreen.js";
import { createAccountView } from "../screens/AccountScreen.js";
import { createAuthView } from "../screens/AuthScreen.js";
import { getAuthState } from "../core/authStore.js";
import { todayKey } from "../core/storage.js";

const TABS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "journal", label: "Journal", icon: "journal" },
  { id: "progress", label: "Progress", icon: "progress" },
  { id: "tasks", label: "Tasks", icon: "tasks" },
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

export function startMainApp(root) {
  clear(root);
  preloadHabitImages();

  const content = el("div", { className: "main-app__content" });
  const pageHost = el("div", { className: "main-app__page" });
  content.append(pageHost);

  /** Stable Home DOM refs — avoids remounting habit images on completion. */
  let homeUi = null;

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

  async function restartApp() {
    app.remove();
    const { startApp } = await import("../core/flowController.js");
    await startApp(root);
  }

  function showAccount() {
    const overlay = el("div", {
      className: "screen is-active",
      style: "z-index:48;background:#000;"
    });
    const view = createAccountView({
      onBack: () => overlay.remove(),
      onSignedOut: async () => {
        overlay.remove();
        await restartApp();
      }
    });
    overlay.append(view);
    root.append(overlay);
  }

  function showAuth(mode = "login") {
    const overlay = el("div", {
      className: "screen is-active",
      style: "z-index:49;background:#000;"
    });
    const view = createAuthView({
      mode,
      onBack: () => overlay.remove(),
      onGuest: () => overlay.remove(),
      onSuccess: async () => {
        overlay.remove();
        await restartApp();
      }
    });
    overlay.append(view);
    root.append(overlay);
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

  function updateWeekStrip(strip) {
    const state = getState();
    strip.querySelectorAll(".week-day").forEach((btn) => {
      const key = btn.dataset.date;
      if (!key) return;
      const ratio = dayCompletionRatio(key);
      const selected = key === state.selectedDate;
      btn.classList.toggle("is-selected", selected);
      btn.classList.toggle("is-complete", ratio >= 1);
      btn.classList.toggle("is-partial", ratio > 0 && ratio < 1);
      btn.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  function syncHabitRow(row, habitId) {
    const state = getState();
    const habit = getHabit(habitId);
    if (!habit || !row) return;
    const done = isHabitDone(habitId, state.selectedDate);
    row.classList.toggle("is-done", done);
    const meta = row.querySelector(".habit-row__meta");
    if (meta) meta.textContent = formatHabitProgress(habit, done);
    const check = row.querySelector(".habit-row__check");
    if (check) {
      check.classList.remove("is-pop");
      void check.offsetWidth;
      if (done) check.classList.add("is-pop");
    }
  }

  function renderHome() {
    const state = getState();
    const dates = weekDates(state.selectedDate);
    let mode = "habits";

    const feed = el("div", { className: "habit-feed" });
    const rowById = new Map();

    function buildHabitRow(id) {
      const habit = getHabit(id);
      if (!habit) return null;
      const done = isHabitDone(id, getState().selectedDate);
      const imageSrc = getHabitImageSrc(habit);
      const row = el(
        "button",
        {
          className: `habit-row${done ? " is-done" : ""}`,
          type: "button",
          dataset: { habitId: id },
          style: `--habit-color:${habit.color}`,
          events: {
            click: () => {
              const before = isHabitDone(id);
              haptic(before ? "light" : "medium");
              toggleHabitCompletion(id);
              // In-place update — keep <img> nodes mounted (no flicker)
              syncHabitRow(row, id);
              if (homeUi?.strip) updateWeekStrip(homeUi.strip);
            }
          }
        },
        [
          el(
            "div",
            {
              className: "habit-row__bg",
              attrs: {
                "data-tone": habit.imageTone || "calm",
                "aria-hidden": "true"
              }
            },
            [
              el("img", {
                className: "habit-row__photo",
                attrs: {
                  src: imageSrc,
                  alt: "",
                  loading: "eager",
                  decoding: "async",
                  fetchpriority: "high"
                },
                events: {
                  error: (e) => {
                    e.currentTarget.style.display = "none";
                  }
                }
              }),
              el("div", { className: "habit-row__scrim" })
            ]
          ),
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
      rowById.set(id, row);
      return row;
    }

    function renderFeed() {
      clear(feed);
      rowById.clear();
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
      getState().selectedHabitIds.forEach((id) => {
        const row = buildHabitRow(id);
        if (row) feed.append(row);
      });
    }

    function syncFeedCompletionOnly() {
      const ids = getState().selectedHabitIds;
      const needsRebuild =
        ids.length !== rowById.size || ids.some((id) => !rowById.has(id));
      if (needsRebuild) {
        renderFeed();
        return;
      }
      ids.forEach((id) => syncHabitRow(rowById.get(id), id));
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
            }${ratio > 0 && ratio < 1 ? " is-partial" : ""}`,
            type: "button",
            dataset: { date: key },
            attrs: { role: "option", "aria-selected": selected ? "true" : "false" },
            events: {
              click: () => {
                setSelectedDate(key);
                haptic("light");
                updateWeekStrip(strip);
                // Same habit cards — only sync completion for the new date
                syncFeedCompletionOnly();
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

    const page = el("div", { className: "fade-in" }, [
      el("div", { className: "home-head" }, [
        el("h1", { className: "todo-title", text: "To-Do" }),
        el("button", {
          className: "account-chip",
          type: "button",
          text: getAuthState().isGuest ? "Guest" : "Account",
          events: {
            click: () => {
              haptic("light");
              if (getAuthState().isGuest) showAuth("signup");
              else showAccount();
            }
          }
        })
      ]),
      strip,
      segmented,
      feed
    ]);

    homeUi = { strip, feed, rowById, syncFeedCompletionOnly };
    return page;
  }

  function renderProgress() {
    const state = getState();
    const duration = getPlanDuration(state);
    const circles = getPlanDayCircles(state);
    const todayValues = getPolygonValuesForDate(state, state.selectedDate || todayKey());
    const color = aspectColor(todayValues);
    const overall = getOverallPlanCompletion(state);
    const todayDaily = getDailyProgress(state, state.selectedDate || todayKey());

    const planStrip = el(
      "div",
      {
        className: "plan-days",
        attrs: {
          role: "list",
          "aria-label": `${duration}-day plan progress`
        }
      },
      circles.map((day) => {
        const pct = day.percentage;
        return el(
          "button",
          {
            className: `plan-day plan-day--${day.status}`,
            type: "button",
            dataset: { date: day.date },
            style: `--day-pct:${pct}`,
            attrs: {
              role: "listitem",
              "aria-label": `Day ${day.dayIndex + 1}, ${pct}% complete`
            },
            events: {
              click: () => {
                setSelectedDate(day.date);
                setMainTab("home");
                haptic("light");
                render();
              }
            }
          },
          [
            el("span", {
              className: "plan-day__ring",
              html:
                day.status === "complete"
                  ? iconSvg("check", { size: 12 })
                  : `<span class="plan-day__num">${day.dayIndex + 1}</span>`
            }),
            el("span", {
              className: "plan-day__fill",
              attrs: { "aria-hidden": "true" }
            })
          ]
        );
      })
    );

    const radar = createRadarChart({ values: todayValues, color });

    const habitSummaries = state.selectedHabitIds
      .map((id) => {
        const habit = getHabit(id);
        if (!habit) return null;
        const doneDays = circles.filter(
          (c) => Boolean(state.completions[c.date]?.[id])
        ).length;
        const pct = Math.round((doneDays / duration) * 100);
        return el(
          "div",
          {
            className: "habit-plan-row",
            style: `--habit-color:${habit.color}`
          },
          [
            el("span", { className: "habit-plan-row__dot" }),
            el("span", { className: "habit-plan-row__title", text: habit.title }),
            el("span", {
              className: "habit-plan-row__meta",
              text: `${doneDays}/${duration} · ${pct}%`
            })
          ]
        );
      })
      .filter(Boolean);

    return el("div", { className: "fade-in" }, [
      el("div", { className: "progress-page__head" }, [
        el("h1", { className: "progress-page__title", text: "Progress" }),
        el("button", {
          className: "account-chip",
          type: "button",
          text: getAuthState().isAuthenticated ? "Account" : "Account / Sync",
          events: {
            click: () => {
              haptic("light");
              showAccount();
            }
          }
        })
      ]),
      el("div", { className: "plan-progress-head" }, [
        el("div", {
          className: "plan-progress-head__label",
          text: `${duration}-day plan`
        }),
        el("div", {
          className: "plan-progress-head__stat",
          text: `${overall}% days fully done · today ${todayDaily.completionPercentage}%`
        })
      ]),
      planStrip,
      el(
        "button",
        {
          className: "growth-link",
          type: "button",
          events: {
            click: () => {
              haptic("light");
              showGrowthChart();
            }
          }
        },
        [
          el("span", { className: "growth-link__label", text: "Growth chart" }),
          el("span", {
            className: "growth-link__hint",
            text: "Today’s habits shape this polygon — tap for details"
          }),
          el("span", {
            className: "growth-link__chevron",
            html: iconSvg("chevron", { size: 18 })
          })
        ]
      ),
      el(
        "div",
        {
          className: "growth-mini",
          style: `--growth-color:${color}`
        },
        [
          radar,
          el("p", {
            className: "growth-mini__note",
            text: "Updates instantly when you complete habits."
          })
        ]
      ),
      el("h2", {
        className: "hint-label",
        text: "Habits in this plan",
        style: "font-size:1.1rem;color:#fff;margin:1.25rem 0 1rem;"
      }),
      el("div", { className: "habit-plan-list" }, habitSummaries)
    ]);
  }

  function showGrowthChart() {
    const state = getState();
    const todayValues = getPolygonValuesForDate(
      state,
      state.selectedDate || todayKey()
    );
    const cumulative = deriveAspectScores(state);
    const color = aspectColor(todayValues);
    const overlay = el("div", {
      className: "screen is-active growth-overlay",
      style: "z-index:45;background:#000;"
    });

    const radar = createRadarChart({ values: todayValues, color });

    const bars = ASPECT_KEYS.map((key) => {
      const v = todayValues[key] || 0;
      return el("div", { className: "growth-bar" }, [
        el("div", { className: "growth-bar__meta" }, [
          el("span", { text: ASPECT_LABELS[key] }),
          el("span", { text: `${Math.round(v * 100)}%` })
        ]),
        el("div", { className: "growth-bar__track" }, [
          el("div", {
            className: "growth-bar__fill",
            style: `width:${Math.round(v * 100)}%;background:${color}`
          })
        ])
      ]);
    });

    const panel = el("div", { className: "growth-panel fade-in" }, [
      el("button", {
        className: "growth-panel__back",
        type: "button",
        text: "← Progress",
        events: {
          click: () => {
            haptic("light");
            overlay.remove();
          }
        }
      }),
      el("h1", { className: "growth-panel__title", text: "Today’s polygon" }),
      el("p", {
        className: "growth-panel__sub",
        text: "Each axis reflects habits completed for the selected day."
      }),
      radar,
      el("div", { className: "growth-bars" }, bars),
      el("p", {
        className: "hint-label",
        text: `Lifetime growth average: ${Math.round(
          (ASPECT_KEYS.reduce((s, k) => s + (cumulative[k] || 0), 0) /
            ASPECT_KEYS.length) *
            100
        )}%`,
        style: "text-align:center;margin-top:1rem;"
      })
    ]);

    overlay.append(panel);
    root.append(overlay);
  }

  function formatDueLabel(dueDate) {
    const today = todayKey();
    const t = new Date(today + "T12:00:00");
    const d = new Date(dueDate + "T12:00:00");
    const diff = Math.round((d - t) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    if (diff < -1) return `${Math.abs(diff)}d overdue`;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short"
    });
  }

  function renderTasks() {
    const listHost = el("div", { className: "task-list" });
    const titleInput = el("input", {
      className: "task-input",
      type: "text",
      attrs: {
        placeholder: "What do you need to do?",
        maxlength: "80",
        autocomplete: "off"
      }
    });
    const dateInput = el("input", {
      className: "task-date",
      type: "date",
      value: todayKey()
    });

    function refreshList() {
      clear(listHost);
      const tasks = [...getState().tasks].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return String(a.dueDate).localeCompare(String(b.dueDate));
      });

      if (!tasks.length) {
        listHost.append(
          el("div", { className: "task-empty" }, [
            el("p", {
              text: "No tasks yet."
            }),
            el("p", {
              className: "task-empty__hint",
              text: "Add something you want to finish — and when."
            })
          ])
        );
        return;
      }

      tasks.forEach((task) => {
        const overdue =
          !task.done && task.dueDate < todayKey();
        listHost.append(
          el(
            "div",
            {
              className: `task-card${task.done ? " is-done" : ""}${
                overdue ? " is-overdue" : ""
              }`
            },
            [
              el("button", {
                className: "task-card__check",
                type: "button",
                attrs: {
                  "aria-label": task.done ? "Mark incomplete" : "Mark complete"
                },
                html: iconSvg("check", { size: 14 }),
                events: {
                  click: () => {
                    toggleTask(task.id);
                    haptic("light");
                    refreshList();
                  }
                }
              }),
              el("div", { className: "task-card__body" }, [
                el("div", { className: "task-card__title", text: task.title }),
                el("div", {
                  className: "task-card__due",
                  text: formatDueLabel(task.dueDate)
                })
              ]),
              el("button", {
                className: "task-card__delete",
                type: "button",
                attrs: { "aria-label": "Delete task" },
                text: "×",
                events: {
                  click: () => {
                    deleteTask(task.id);
                    haptic("light");
                    refreshList();
                  }
                }
              })
            ]
          )
        );
      });
    }

    refreshList();

    return el("div", { className: "fade-in" }, [
      el("h1", { className: "todo-title", text: "Tasks" }),
      el("p", {
        className: "adjust__sub",
        text: "One-off to-dos with a due date — separate from daily habits."
      }),
      el("div", { className: "task-composer" }, [
        titleInput,
        el("div", { className: "task-composer__row" }, [
          dateInput,
          createButton({
            label: "Add",
            block: false,
            className: "task-composer__add",
            onClick: () => {
              if (!titleInput.value.trim()) return;
              addTask({
                title: titleInput.value,
                dueDate: dateInput.value || todayKey()
              });
              titleInput.value = "";
              dateInput.value = todayKey();
              haptic("medium");
              refreshList();
            }
          })
        ])
      ]),
      listHost
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
    if (tab === "progress") {
      homeUi = null;
      page = renderProgress();
    } else if (tab === "journal") {
      homeUi = null;
      page = renderJournal();
    } else if (tab === "tasks") {
      homeUi = null;
      page = renderTasks();
    } else if (tab === "trophies") {
      homeUi = null;
      page = renderTrophies();
    } else {
      page = renderHome();
    }
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
