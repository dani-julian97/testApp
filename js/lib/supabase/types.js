/**
 * @typedef {Object} ProfileRow
 * @property {string} id
 * @property {string|null} email
 * @property {string|null} display_name
 * @property {string|null} avatar_url
 * @property {string|null} timezone
 * @property {string|null} locale
 * @property {boolean} onboarding_completed
 * @property {number} current_onboarding_step
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} UserPlanRow
 * @property {string} id
 * @property {string} user_id
 * @property {number} duration_days
 * @property {string} start_date
 * @property {number} current_day
 * @property {'active'|'completed'|'paused'|'cancelled'} status
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} QuizAnswerRow
 * @property {string} id
 * @property {string} user_id
 * @property {string} question_id
 * @property {*} answer
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} UserHabitRow
 * @property {string} id
 * @property {string} user_id
 * @property {string} habit_id
 * @property {boolean} is_selected
 * @property {number|null} target_frequency
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} TaskCompletionRow
 * @property {string} id
 * @property {string} user_id
 * @property {string} habit_id
 * @property {string} task_id
 * @property {string} completion_date
 * @property {boolean} completed
 * @property {string|null} completed_at
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} UserPreferencesRow
 * @property {string} user_id
 * @property {boolean} sound_enabled
 * @property {boolean} haptics_enabled
 * @property {boolean} notifications_enabled
 * @property {string} theme
 * @property {string|null} preferred_reminder_time
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} UserAppStateRow
 * @property {string} user_id
 * @property {Array} custom_habits
 * @property {Array} journal_entries
 * @property {Array} tasks
 * @property {number} xp
 * @property {Array} unlocked_trophies
 * @property {boolean} contract_signed
 * @property {string|null} selected_date
 * @property {string|null} main_tab
 * @property {string} updated_at
 */

/**
 * @typedef {Object} UserProfileInput
 * @property {string} [display_name]
 * @property {string} [locale]
 * @property {string} [timezone]
 * @property {string} [avatar_url]
 */

export {};
