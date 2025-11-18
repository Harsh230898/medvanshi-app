// src/context/AIChatContext.jsx
import React, { useState, useContext, createContext, useCallback } from 'react';
import NotificationContext from './NotificationContext';
import FlashcardContext from './FlashcardContext';
import UIContext from './UIContext';
import { getGroqCompletion } from '../services/firestoreService';

const AIChatContext = createContext();

export const AIChatProvider = ({ children }) => {
  const notificationContext = useContext(NotificationContext);
  const flashcardContext = useContext(FlashcardContext);
  const uiContext = useContext(UIContext);

  const INITIAL_MESSAGE = { 
    sender: 'ai', 
    content: "👋 Welcome to MedVanshi AI! I'm your doubt solver and high-yield flashcard generator. What can I help you study today?", 
    type: 'text' 
  };

  const [aiMessages, setAiMessages] = useState([INITIAL_MESSAGE]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiIntroShown, setAiIntroShown] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('medvanshi_ai_intro') === 'true';
    }
    return false;
  });
  
  // --- NEW: Clear Chat Function ---
  const clearChat = () => {
    setAiMessages([INITIAL_MESSAGE]);
    notificationContext?.addNotification("Chat session cleared.", "info");
  };

  const saveAIFlashcards = (flashcards, topic) => {
    if (!flashcards || flashcards.length === 0) {
      notificationContext?.addNotification("Failed to save: No flashcards found.", 'error');
      return;
    }
    const deckName = `🤖 AI: ${topic.substring(0, 30).trim()} - ${new Date().toLocaleDateString()}`;
    
    const newDeck = {
        name: deckName,
        cards: flashcards.length,
        mastered: 0,
        toReview: flashcards.length,
        color: 'from-purple-500 to-pink-500', 
        icon: '🤖',
        keywords: topic.toLowerCase(),
        content: flashcards.map((card, index) => ({
            id: index,
            question: card.cue || "No Question",
            answer: card.answer || "No Answer",
            highYieldNote: card.highYieldNote || "",
            tags: (Array.isArray(card.tags) ? card.tags : []).join(', '),
        }))
    };

    flashcardContext?.addDeck(newDeck);
    notificationContext?.addNotification(`Deck "${deckName}" saved with ${flashcards.length} cards!`, 'success');
  };

  const handleAITextResponse = (content) => {
    setAiMessages(prev => [...prev, { sender: 'ai', content: content, type: 'text' }]);
  };

  const handleAIFlashcardResponse = (jsonString, userPrompt) => {
    try {
      const data = JSON.parse(jsonString);
      const flashcards = data.flashcards;
      if (!flashcards || flashcards.length === 0) throw new Error("No flashcards generated.");
      const topic = userPrompt.replace(/flashcard(s)?|create|high-yield on|generate/gi, '').trim() || "Generated Topic";
      
      const previewContent = `
**✅ Generated ${flashcards.length} High-Yield Flashcards** on **${topic}**.

**Card 1:** ${flashcards[0].cue}
**Card 2:** ${flashcards[1].cue}
...
Click below to save this deck.`;

      setAiMessages(prev => [...prev, {
          sender: 'ai',
          content: previewContent,
          type: 'flashcard_preview',
          payload: flashcards,
          topic: topic
      }]);
    } catch (e) {
      console.error("AI Format Error:", e);
      notificationContext?.addNotification("AI returned an invalid format. Please try again.", 'error');
      handleAITextResponse("I had trouble formatting the flashcards. Could you try asking again?");
    }
  };

  const handleUserSubmit = useCallback(async (userInput) => {
    if (aiLoading || userInput.length < 3) return;
    setAiMessages(prev => [...prev, { sender: 'user', content: userInput, type: 'text' }]);
    setAiLoading(true);
    uiContext?.setIsGlobalLoading(true);

    const lowerCaseInput = userInput.toLowerCase();
    let intent = 'doubt_solver';
    if (lowerCaseInput.includes('flashcard') || lowerCaseInput.includes('card') || lowerCaseInput.includes('create') || lowerCaseInput.includes('generate')) {
      intent = 'flashcard';
    }

    try {
      let aiResponseContent;
      
      if (intent === 'flashcard') {
        const flashcardSystemPrompt = `
          You are an expert NEET PG tutor. 
          Generate exactly 10 high-yield flashcards based on the user's topic. 
          Format MUST be a valid JSON object with this structure:
          {
            "flashcards": [
              { "cue": "Question?", "answer": "Answer", "highYieldNote": "Extra info", "tags": ["tag1", "tag2"] }
            ]
          }
        `;
        aiResponseContent = await getGroqCompletion(flashcardSystemPrompt, userInput, true);
        handleAIFlashcardResponse(aiResponseContent, userInput);
      } else {
        const doubtSolverSystemPrompt = `You are a concise NEET PG medical tutor. Answer the user's question using markdown. Bold key terms.`;
        aiResponseContent = await getGroqCompletion(doubtSolverSystemPrompt, userInput, false);
        handleAITextResponse(aiResponseContent);
      }
    } catch (error) {
      console.error(error);
      notificationContext?.addNotification("AI assistant failed to respond. Check connection.", 'error');
      handleAITextResponse("Sorry, I encountered an internal error. Please try again.");
    } finally {
      setAiLoading(false);
      uiContext?.setIsGlobalLoading(false);
    }
  }, [aiLoading, notificationContext, uiContext, flashcardContext]);

  return (
    <AIChatContext.Provider value={{ 
      aiMessages, aiLoading, aiIntroShown, setAiIntroShown, 
      handleUserSubmit, saveAIFlashcards, clearChat // <-- Exported here
    }}>
      {children}
    </AIChatContext.Provider>
  );
};

export default AIChatContext;