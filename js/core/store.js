/**
 * Minimal pub/sub store for onboarding state.
 */
const listeners = new Set();

const state = {
  screen: "welcome", // welcome | login | signup | quiz | ready
  quizStep: 0,
  answers: {},
  direction: 1
};

export function getState() {
  return state;
}

export function setState(partial) {
  Object.assign(state, partial);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setAnswer(questionId, value) {
  state.answers = { ...state.answers, [questionId]: value };
  listeners.forEach((fn) => fn(state));
}

export function getAnswer(questionId) {
  return state.answers[questionId];
}

export function resetQuiz() {
  state.quizStep = 0;
  state.answers = {};
  state.direction = 1;
  listeners.forEach((fn) => fn(state));
}
