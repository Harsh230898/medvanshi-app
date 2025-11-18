// src/views/FlashcardStudyView.jsx
import React, { useContext, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import UIContext from '../context/UIContext';
import FlashcardContext from '../context/FlashcardContext';

const FlashcardStudyView = () => {
  const { getTextColor, getCardStyle, isDarkMode, setCurrentView, getBackgroundColor } = useContext(UIContext);
  const { 
    activeStudyDeck, currentCardIndex, isCardFlipped, setIsCardFlipped,
    nextCard, prevCard, endStudySession
  } = useContext(FlashcardContext);
  const CardStyle = getCardStyle();
  
  useEffect(() => {
    if (!activeStudyDeck) {
      setCurrentView('flashcards');
    }
  }, [activeStudyDeck, setCurrentView]);

  if (!activeStudyDeck) {
    return null;
  }
  
  const card = activeStudyDeck.content 
    ? activeStudyDeck.content[currentCardIndex]
    : { id: 0, question: 'Deck is empty', answer: 'Add cards to this deck to study them.', highYieldNote: '' };

  return (
    <div className={`max-w-4xl mx-auto flex flex-col h-full py-10 ${getBackgroundColor('', 'bg-slate-900')}`}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className={`text-3xl font-black ${getTextColor('text-slate-900', 'text-white')}`}>{activeStudyDeck.name}</h2>
          <p className={getTextColor('text-lg text-slate-600', 'text-slate-400')}>
            Card {currentCardIndex + 1} of {activeStudyDeck.content.length}
          </p>
        </div>
        <button
          onClick={endStudySession}
          className="px-4 py-2 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all flex items-center gap-2"
        >
          <X className="w-5 h-5" />
          End Session
        </button>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div 
          className="w-full h-[400px] perspective-1000"
          onClick={() => setIsCardFlipped(!isCardFlipped)}
        >
          <div 
            className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-500 ${isCardFlipped ? 'rotate-y-180' : ''}`}
          >
            {/* Front of Card */}
            <div className={`absolute w-full h-full backface-hidden rounded-3xl p-10 flex items-center justify-center text-center ${CardStyle.bg} ${CardStyle.border} border-2`}>
              <p className={`text-3xl font-semibold ${getTextColor('text-slate-800', 'text-white')}`}>
                {card.question}
              </p>
            </div>
            {/* Back of Card */}
            <div className={`absolute w-full h-full backface-hidden rotate-y-180 rounded-3xl p-10 flex flex-col items-center justify-center text-center ${CardStyle.bg} ${CardStyle.border} border-2 border-purple-400`}>
              <p className={`text-2xl font-semibold ${getTextColor('text-slate-800', 'text-white')}`}>
                {card.answer}
              </p>
              {card.highYieldNote && (
                <p className="mt-4 p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-sm text-purple-700 dark:text-purple-300 italic">
                  {card.highYieldNote}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={prevCard}
          className="px-8 py-4 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
        >
          <ChevronRight className="w-5 h-5 transform rotate-180" />
          Previous
        </button>
        <button
          onClick={() => setIsCardFlipped(!isCardFlipped)}
          className="px-8 py-4 rounded-2xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-all shadow-lg"
        >
          {isCardFlipped ? 'Show Question' : 'Flip to Answer'}
        </button>
        <button
          onClick={nextCard}
          className="px-8 py-4 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default FlashcardStudyView;