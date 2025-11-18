// src/services/api.js
import { FLASHCARD_JSON_SCHEMA } from "../constants/data";

export const mockFirebaseSignUp = (email, password) => new Promise((resolve, reject) => {
    setTimeout(() => {
        if (password.length < 6) {
            reject({ code: 'auth/weak-password', message: 'Password should be at least 6 characters.' });
        } else if (email.includes('error')) {
            reject({ code: 'auth/email-already-in-use', message: 'Email already in use.' });
        } else {
            resolve({ 
                uid: 'mock-user-' + Date.now(), 
                email: email,
                displayName: email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
            });
        }
    }, 1500);
});

export const mockFirebaseLogIn = (email, password) => new Promise((resolve, reject) => {
    setTimeout(() => {
        if (email.toLowerCase() === 'dr.devanshi@medvanshi.com' && password === 'password123') {
            resolve({ 
                uid: 'mock-devanshi-1', 
                email: email, 
                displayName: 'Dr. Devanshi'
            });
        } else if (email.includes('fail')) {
            reject({ code: 'auth/invalid-email', message: 'Invalid email or password.' });
        } else {
            reject({ code: 'auth/wrong-password', message: 'Invalid email or password.' });
        }
    }, 1500);
});

export const mockFirebaseLogOut = () => new Promise(resolve => {
    setTimeout(() => {
        resolve(true);
    }, 500);
});

export const mockGroqApiCall = async (systemPrompt, userPrompt, isJson) => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (isJson) {
      const topic = userPrompt.replace(/flashcard(s)?|create|high-yield on|generate/gi, '').trim();
      const mockCards = Array.from({ length: 10 }, (_, i) => ({
          cue: `Q${i + 1}: High-yield question on ${topic}`,
          answer: `A${i + 1}: Concise answer with a clinical pearl.`,
          highYieldNote: `Buzzword: ${topic} fact #${i + 1}`,
          subject: topic.split(' ')[0] || 'Pharmacology',
          tags: [topic.split(' ')[0] || 'Topic', 'High Yield']
      }));
      return JSON.stringify({ flashcards: mockCards });
  } else {
      const greetingResponse = `
          👋 **Welcome back, Dr. Devanshi!** I'm ready to assist your NEET PG studies.
          My capabilities include:
          * **Doubt Solver:** Get concise, accurate explanations on any medical topic.
          * **Flashcard Generator:** Generate **10 high-yield cards** on any concept (e.g., "Create cards on ACE inhibitors").
          What specific concept or question do you have today?
          `;
      const conceptResponse = `
          The concept of **${userPrompt}** is central to NEET PG Medicine.
          **Key mechanism:** It involves the structural or functional failure of a system, leading to characteristic signs.
          For instance, in liver failure, reduced albumin production causes low oncotic pressure, resulting in **edema**.
          **High-Yield Fact:** Spider angiomata, jaundice, and palmar erythema form a common clinical triad.
          Would you like me to generate **10 high-yield flashcards** on this topic?
          `;
      if (userPrompt.toLowerCase().includes('hello') || userPrompt.toLowerCase().includes('hi')) {
          return greetingResponse;
      }
      return conceptResponse;
  }
};