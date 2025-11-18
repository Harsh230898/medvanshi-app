// src/context/FlashcardContext.jsx
import React, { useState, useContext, createContext, useEffect } from 'react';
import UIContext from './UIContext';
import { auth } from '../services/firebase';
import { getUserDecks, createUserDeck, updateUserDeck, deleteUserDeck } from '../services/firestoreService';

const FlashcardContext = createContext();

export const FlashcardProvider = ({ children }) => {
  const uiContext = useContext(UIContext);
  
  const [flashcardDecks, setFlashcardDecks] = useState([]);
  const [activeStudyDeck, setActiveStudyDeck] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // LOAD DECKS FROM FIRESTORE
  useEffect(() => {
    if (auth.currentUser) {
      getUserDecks(auth.currentUser.uid).then(decks => {
        if (decks.length > 0) {
          setFlashcardDecks(decks);
        }
      });
    }
  }, [auth.currentUser]);

  const addDeck = async (newDeck) => {
    setFlashcardDecks(prev => [...prev, newDeck]);
    if (auth.currentUser) {
      try {
        await createUserDeck(auth.currentUser.uid, newDeck);
      } catch (error) {
        console.error("Failed to save deck to cloud", error);
      }
    }
  };

  // NEW: Add a single card to an existing deck
  const addCardToDeck = async (deckId, cardData) => {
    const updatedDecks = flashcardDecks.map(deck => {
      if (deck.id === deckId || (deck.name === deckId && !deck.id)) { // Handle case where ID might be missing locally
        const newContent = [...(deck.content || []), { ...cardData, id: Date.now() }];
        return {
          ...deck,
          content: newContent,
          cards: newContent.length,
          toReview: newContent.length
        };
      }
      return deck;
    });
    
    setFlashcardDecks(updatedDecks);

    if (auth.currentUser) {
       const targetDeck = updatedDecks.find(d => d.id === deckId);
       if(targetDeck && targetDeck.id) {
         await updateUserDeck(auth.currentUser.uid, deckId, {
            content: targetDeck.content,
            cards: targetDeck.content.length
         });
       }
    }
  };

  const deleteDeck = async (deckId) => {
    setFlashcardDecks(prev => prev.filter(d => d.id !== deckId));
    if (auth.currentUser) {
      await deleteUserDeck(auth.currentUser.uid, deckId);
    }
  };

  const startStudySession = (deck) => {
    if (!deck.content || deck.content.length === 0) {
      console.error("Deck has no content to study.");
      return;
    }
    setActiveStudyDeck(deck);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    if (uiContext) {
      uiContext.setCurrentView('flashcard-study');
    }
  };

  const endStudySession = () => {
    setActiveStudyDeck(null);
    if (uiContext) {
      uiContext.setCurrentView('flashcards');
    }
  };

  const nextCard = () => {
    setIsCardFlipped(false);
    setCurrentCardIndex(prev => (prev + 1) % (activeStudyDeck?.content.length || 1));
  };

  const prevCard = () => {
    setIsCardFlipped(false);
    setCurrentCardIndex(prev => (prev - 1 + (activeStudyDeck?.content.length || 1)) % (activeStudyDeck?.content.length || 1));
  };

  return (
    <FlashcardContext.Provider value={{ 
      flashcardDecks, addDeck, deleteDeck, addCardToDeck, // <-- Exporting new function
      startStudySession, activeStudyDeck, currentCardIndex, 
      isCardFlipped, setIsCardFlipped, nextCard, prevCard, endStudySession
    }}>
      {children}
    </FlashcardContext.Provider>
  );
};

export default FlashcardContext;