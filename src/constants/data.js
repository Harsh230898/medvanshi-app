// src/constants/data.js

export const Q_BANK_SOURCES = ['Marrow', 'Prepladder', 'Cerebellum', 'EPW Dams'];

export const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

export const COGNITIVE_SKILL_OPTIONS = ['Recall', 'Diagnostic Reasoning', 'Applied'];

export const TIME_PER_QUESTION_SECONDS = 90;
export const TOTAL_TEST_MINUTES = 180;

export const FLASHCARD_JSON_SCHEMA = {
  type: "object",
  properties: {
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          cue: { type: "string" },
          answer: { type: "string" },
          highYieldNote: { type: "string" },
          subject: { type: "string" },
          tags: { type: "array", items: { type: "string" } }
        },
        required: ["cue", "answer"]
      }
    }
  },
  required: ["flashcards"]
};

export const MOCK_CASE = {
  id: 'case_001',
  title: 'Acute Chest Pain in 55-Year-Old Male',
  description: 'A 55-year-old male presents to the emergency department with acute chest pain...',
  clinicalFindings: [
    'Chest pain radiating to left arm',
    'Sweating and nausea',
    'History of hypertension and smoking'
  ],
  vitals: {
    BP: '160/95 mmHg',
    HR: '102 bpm',
    RR: '22/min',
    Temp: '98.6°F',
    SpO2: '94% on room air'
  },
  questions: [
    {
      id: 'q1',
      question: 'What is the most likely diagnosis?',
      options: ['A) GERD', 'B) Acute MI', 'C) Pneumonia', 'D) Anxiety'],
      answer: 'B'
    }
  ]
};
