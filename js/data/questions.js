/**
 * Configurable questionnaire definition.
 * Add / reorder questions here without touching screen logic.
 */
export const QUESTIONS = [
  {
    id: "age",
    title: "How old are you?",
    hint: "This helps us tailor your plan.",
    type: "single",
    options: [
      { id: "under_18", label: "Under 18" },
      { id: "18_24", label: "18–24" },
      { id: "25_34", label: "25–34" },
      { id: "35_44", label: "35–44" },
      { id: "45_54", label: "45–54" },
      { id: "55_plus", label: "55+" }
    ]
  },
  {
    id: "change",
    title: "What would you most like to change?",
    hint: "Select everything that resonates.",
    type: "multi",
    options: [
      { id: "habits", label: "Build healthier habits" },
      { id: "mental", label: "Improve mental wellbeing" },
      { id: "productive", label: "Become more productive" },
      { id: "purpose", label: "Find more purpose" },
      { id: "relationships", label: "Improve relationships" },
      { id: "stress", label: "Reduce stress" },
      { id: "physical", label: "Improve physical health" },
      { id: "routine", label: "Create a better routine" },
      { id: "other", label: "Other" }
    ]
  },
  {
    id: "why",
    title: "Why is this important to you?",
    hint: "Choose one — add a note if you’d like.",
    type: "single_with_text",
    textPlaceholder: "Share a little more (optional)",
    options: [
      { id: "happier", label: "I want to feel happier" },
      { id: "stuck", label: "I feel stuck" },
      { id: "balance", label: "I want more balance" },
      { id: "goal", label: "I have an important goal" },
      { id: "healthier", label: "I want a healthier life" },
      { id: "motivation", label: "I lost motivation" },
      { id: "life_change", label: "I'm going through a life change" },
      { id: "other", label: "Other" }
    ]
  }
];

export const TOTAL_STEPS = QUESTIONS.length;
