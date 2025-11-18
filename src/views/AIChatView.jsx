// src/views/AIChatView.jsx
import React, { useState, useContext, useRef, useEffect } from 'react';
import { Home, Brain, Lightbulb, CheckSquare, ArrowUp, RefreshCw, Sparkles } from 'lucide-react';
import UIContext from '../context/UIContext';
import AIChatContext from '../context/AIChatContext';

const AIChatView = () => {
  const { getBackgroundColor, isDarkMode, setCurrentView } = useContext(UIContext);
  const { 
    aiMessages, aiLoading, 
    handleUserSubmit, saveAIFlashcards, clearChat 
  } = useContext(AIChatContext);
  
  const aiChatEndRef = useRef(null);
  const [chatInput, setChatInput] = useState('');
  
  // Show animation if it's a fresh session (only the welcome message exists)
  const [showIntro, setShowIntro] = useState(aiMessages.length === 1);

  // Handle Intro Animation Timer
  useEffect(() => {
    if (showIntro) {
      const timer = setTimeout(() => {
        setShowIntro(false);
      }, 3000); // 3 seconds duration
      return () => clearTimeout(timer);
    }
  }, [showIntro]);

  // Re-trigger animation if chat is cleared
  useEffect(() => {
    if (aiMessages.length === 1) {
      setShowIntro(true);
    }
  }, [aiMessages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (aiChatEndRef.current) {
      aiChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages]);

  // Styles
  const buttonStyle = isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-slate-900 border-slate-300';
  const aiBubbleStyle = isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-900';
  const userBubbleStyle = 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
  
  // --- OPENING ANIMATION OVERLAY ---
  if (showIntro) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl transition-all duration-700">
        <div className="relative">
          {/* Pulsing Glow Effect */}
          <div className="absolute -inset-4 bg-purple-500/30 rounded-full blur-xl animate-pulse"></div>
          
          {/* Logo Icon */}
          <div className="relative p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl mb-8 transform transition-transform hover:scale-105">
            <Brain className="w-16 h-16 text-white animate-bounce" />
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 mb-4 animate-pulse">
          MedVanshi AI
        </h1>
        
        <div className="flex items-center gap-2 text-purple-300 text-lg font-medium">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span>Initializing Personal Tutor...</span>
        </div>
      </div>
    );
  }

  // --- MAIN CHAT INTERFACE ---
  return (
    <div className={`h-full flex flex-col p-4 lg:p-8 ${getBackgroundColor('bg-gray-50', 'bg-slate-900')}`}>
      
      {/* Header */}
      <div className={`flex justify-between items-center p-4 border-b ${isDarkMode ? 'bg-slate-800 border-purple-700' : 'bg-white border-purple-200'} rounded-2xl shadow-md mb-6`}>
        <button onClick={() => setCurrentView('home')} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-purple-100'}`} title="Go to Home">
          <Home className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <div className="relative">
             <Brain className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} ${aiLoading ? 'animate-spin' : ''}`} />
             {aiLoading && <span className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full animate-ping"></span>}
          </div>
          <span className="font-black text-2xl hidden md:block">MedVanshi AI Assistant</span>
          <span className="font-black text-xl md:hidden">AI Assistant</span>
        </div>
        
        {/* Clear Chat Button */}
        <button 
          onClick={clearChat} 
          className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-slate-700 text-purple-300' : 'hover:bg-purple-100 text-purple-600'}`}
          title="Start New Chat"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {/* Welcome Suggestions */}
          {aiMessages.length === 1 && aiMessages[0].type === 'text' && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center space-y-2 mb-8">
                <p className="text-4xl">👋</p>
                <h3 className="font-black text-2xl">How can I help you study?</h3>
              </div>
              <h3 className="font-bold text-sm opacity-70 uppercase tracking-wider ml-1">Suggested Topics:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                    "Explain Diabetes Pathophysiology",
                    "Create 10 flashcards on ACE Inhibitors",
                    "What is Charcot's triad?",
                    "Side effects of Metformin?"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => { 
                      setChatInput(suggestion); 
                      handleUserSubmit(suggestion); 
                      setChatInput('');
                    }}
                    className={`text-left p-4 rounded-xl border font-semibold text-sm transition-all hover:scale-[1.02] ${buttonStyle} hover:bg-purple-600 hover:text-white dark:hover:bg-purple-700 dark:hover:text-white`}
                  >
                    <Lightbulb className="w-4 h-4 inline mr-2 text-yellow-500" /> {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Bubble Stream */}
          {aiMessages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
              
              {/* AI Message */}
              {msg.sender === 'ai' && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                     <Brain className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div className={`p-4 rounded-2xl rounded-tl-none shadow-sm ${aiBubbleStyle}`}>
                    {msg.type === 'text' && <p className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />}
                    {msg.type === 'flashcard_preview' && (
                      <div>
                        <p className="whitespace-pre-wrap font-medium mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
                        <button
                          onClick={() => saveAIFlashcards(msg.payload, msg.topic)}
                          className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <CheckSquare className="w-5 h-5" /> Save to Flashcards
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* User Message */}
              {msg.sender === 'user' && (
                <div className={`max-w-[85%] p-4 rounded-2xl rounded-tr-none shadow-md ${userBubbleStyle}`}>
                  <p className="font-medium">{msg.content}</p>
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {aiLoading && (
            <div className="flex justify-start animate-pulse">
               <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                     <Brain className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div className={`p-4 rounded-2xl rounded-tl-none shadow-sm ${aiBubbleStyle} flex items-center gap-2`}>
                    <span className="text-sm font-semibold">Thinking</span>
                    <div className="flex space-x-1">
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
               </div>
            </div>
          )}
          <div ref={aiChatEndRef} />
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-purple-700' : 'border-purple-200'} bg-white dark:bg-slate-800 rounded-b-2xl shadow-lg mt-4`}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask a doubt or generate content..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !aiLoading && chatInput.length >= 3) {
                  handleUserSubmit(chatInput);
                  setChatInput('');
                }
              }}
              disabled={aiLoading}
              className={`flex-1 p-4 rounded-xl border focus:outline-none shadow-inner font-medium ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-slate-300 text-slate-900'} ${aiLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <button
              onClick={() => {
                handleUserSubmit(chatInput);
                setChatInput('');
              }}
              disabled={aiLoading || chatInput.length < 3}
              className={`p-4 rounded-xl transition-all shadow-lg ${
                aiLoading || chatInput.length < 3
                  ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 hover:shadow-purple-500/30'
              }`}
            >
              <ArrowUp className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatView;