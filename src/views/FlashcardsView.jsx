// src/views/FlashcardsView.jsx
import React, { useState, useContext } from 'react';
import { Lightbulb, Layers, Zap, Maximize2, Plus, X, Save, Trash2 } from 'lucide-react';
import UIContext from '../context/UIContext';
import FlashcardContext from '../context/FlashcardContext';

const FlashcardsView = () => {
  const { getTextColor, getCardStyle, getBackgroundColor, isDarkMode } = useContext(UIContext);
  const { flashcardDecks, addDeck, addCardToDeck, deleteDeck, startStudySession } = useContext(FlashcardContext);
  const CardStyle = getCardStyle();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeEditDeck, setActiveEditDeck] = useState(null); // For adding cards

  // Modal to Create New Deck
  const CreateDeckModal = () => {
    const [deckName, setDeckName] = useState('');
    const handleSubmit = () => {
      if (deckName.trim()) {
        addDeck({
          name: deckName,
          cards: 0,
          mastered: 0,
          toReview: 0,
          color: `from-${['red', 'green', 'blue', 'pink'][Math.floor(Math.random() * 4)]}-300 to-${['rose', 'teal', 'cyan', 'fuchsia'][Math.floor(Math.random() * 4)]}-300`,
          icon: '📝',
          keywords: deckName.toLowerCase(),
          content: []
        });
        setDeckName('');
        setIsCreateModalOpen(false); 
      }
    };
    
    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setIsCreateModalOpen(false)}>
        <div className={`w-full max-w-lg rounded-3xl p-8 shadow-2xl ${CardStyle.bg} ${CardStyle.border}`} onClick={(e) => e.stopPropagation()}>
          <h2 className="text-3xl font-black mb-6 flex items-center gap-3 border-b pb-3">
            <Lightbulb className="w-8 h-8 text-purple-500" /> Create New Deck
          </h2>
          <input
            type="text"
            placeholder="Enter Deck Name (e.g., 'CVS Mnemonics')"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="w-full p-4 mb-6 border-2 rounded-xl text-lg font-semibold bg-white/50 dark:bg-slate-800/50"
          />
          <div className="flex justify-between gap-3">
            <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 bg-slate-300 text-slate-800 rounded-xl font-bold">Cancel</button>
            <button onClick={handleSubmit} disabled={!deckName.trim()} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold">Create</button>
          </div>
        </div>
      </div>
    );
  };

  // Modal to Add Cards to a Deck
  const EditDeckModal = () => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [note, setNote] = useState('');

    const handleAddCard = () => {
      if (question && answer) {
        addCardToDeck(activeEditDeck.id, { question, answer, highYieldNote: note });
        setQuestion('');
        setAnswer('');
        setNote('');
        // Close modal or keep open to add more? Let's keep open.
        alert("Card Added!");
      }
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setActiveEditDeck(null)}>
        <div className={`w-full max-w-2xl rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] ${CardStyle.bg} ${CardStyle.border}`} onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6 border-b pb-3">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <Zap className="w-6 h-6 text-orange-500" /> Edit: {activeEditDeck.name}
            </h2>
            <button onClick={() => setActiveEditDeck(null)}><X className="w-6 h-6" /></button>
          </div>

          <div className="space-y-4">
             <h3 className="font-bold">Add New Card</h3>
             <input placeholder="Question / Front Side" value={question} onChange={e => setQuestion(e.target.value)} className="w-full p-3 rounded-xl border" />
             <textarea placeholder="Answer / Back Side" value={answer} onChange={e => setAnswer(e.target.value)} className="w-full p-3 rounded-xl border h-24" />
             <input placeholder="High Yield Note (Optional)" value={note} onChange={e => setNote(e.target.value)} className="w-full p-3 rounded-xl border" />
             
             <button onClick={handleAddCard} disabled={!question || !answer} className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 flex items-center justify-center gap-2">
               <Plus className="w-5 h-5" /> Add Card
             </button>
          </div>
          
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-bold mb-4">Existing Cards ({activeEditDeck.content ? activeEditDeck.content.length : 0})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
               {activeEditDeck.content && activeEditDeck.content.map((c, i) => (
                 <div key={i} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm">
                    <span className="font-bold">Q:</span> {c.question} <br/>
                    <span className="font-bold text-purple-500">A:</span> {c.answer}
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className={`text-4xl lg:text-6xl font-black mb-3 ${getTextColor('text-slate-900', 'text-white')}`}>Flashcards</h2>
          <p className={getTextColor('text-xl text-slate-600', 'text-slate-400')}>Your private, user-generated study decks.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {flashcardDecks.map((deck, i) => (
            <div key={i} className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 hover:shadow-2xl transition-all border relative group`}>
              
              {/* Delete Button */}
              <button 
                onClick={(e) => { e.stopPropagation(); if(confirm('Delete this deck?')) deleteDeck(deck.id); }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className={`w-16 h-16 bg-gradient-to-br ${deck.color} rounded-2xl flex items-center justify-center text-4xl mb-5 shadow-xl`}>
                {deck.icon}
              </div>
              <h3 className={getTextColor('font-black text-2xl mb-2 text-slate-900', 'text-white')}>{deck.name}</h3>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                <span className='flex items-center gap-1'><Layers className='w-4 h-4 text-purple-500'/> {deck.cards || 0} Cards</span>
                <span className='flex items-center gap-1'><Zap className='w-4 h-4 text-orange-500'/> {deck.toReview || 0} To Review</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                    onClick={() => setActiveEditDeck(deck)}
                    className="flex-1 py-2 border-2 border-purple-500 text-purple-500 rounded-xl font-bold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                >
                    Edit
                </button>
                <button 
                    onClick={() => startStudySession(deck)}
                    className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
                    disabled={!deck.content || deck.content.length === 0}
                >
                    Study
                </button>
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className={getBackgroundColor('bg-gradient-to-br from-purple-100 to-pink-100', 'bg-slate-800') + ' w-full rounded-3xl p-12 text-center border-2 border-purple-200 dark:border-purple-800 hover:scale-[1.01] transition-transform'}
        >
          <Lightbulb className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h3 className={getTextColor('text-3xl font-black mb-3 text-slate-900', 'text-white')}>Create New Deck</h3>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl inline-flex items-center gap-2">
            <Maximize2 className='w-5 h-5'/> Create Deck
          </div>
        </button>
      </div>
      {isCreateModalOpen && <CreateDeckModal />}
      {activeEditDeck && <EditDeckModal />}
    </>
  );
};

export default FlashcardsView;