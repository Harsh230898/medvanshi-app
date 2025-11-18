// src/components/MainHeader.jsx
import React, { useContext } from 'react';
import { Search, Clock, ChevronRight, Sun, Moon, Bell, Brain } from 'lucide-react';
import UIContext from '../context/UIContext';
import NotificationContext from '../context/NotificationContext';

const MainHeader = ({ searchQuery, setSearchQuery, performSearch }) => {
  const { isDarkMode, setIsDarkMode, setCurrentView, isGlobalLoading } = useContext(UIContext);
  const { notifications } = useContext(NotificationContext);

  return (
    <div className="max-w-7xl mx-auto mb-8 flex items-center gap-4">
      <div className="relative flex-1">
        <Search className={`absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 ${isDarkMode ? 'text-purple-300' : 'text-purple-400'}`} />
        {isGlobalLoading && (
          <Clock className="absolute left-14 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400 animate-spin" />
        )}
        <input
          id="global-search"
          name="global_search"
          type="text"
          placeholder="Search questions, topics, flashcards, mnemonics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') performSearch();
          }}
          className={`w-full pl-16 pr-6 py-5 rounded-2xl text-lg font-semibold placeholder-slate-400 focus:outline-none focus:border-purple-400 shadow-lg border-2 transition-colors ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700 text-white' 
              : 'bg-white/70 backdrop-blur-xl border-purple-200 text-slate-900'
          }`}
        />
        {searchQuery.trim() && (
          <button
            onClick={performSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`p-4 rounded-full transition-colors shadow-lg ${
          isDarkMode 
            ? 'bg-purple-700 text-yellow-300 hover:bg-purple-600' 
            : 'bg-white text-purple-600 hover:bg-purple-50'
        }`}
        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>

      <button
        onClick={() => console.log("Open notification drawer")} // Future: setCurrentView('notifications')
        className={`relative p-4 rounded-full transition-colors shadow-lg ${
          isDarkMode 
            ? 'bg-slate-800 text-purple-300 hover:bg-slate-700' 
            : 'bg-white text-purple-600 hover:bg-purple-50'
        }`}
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        {notifications.length > 0 && (
          <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {notifications.length}
          </span>
        )}
      </button>

      <button
          onClick={() => setCurrentView('ai-chat')}
          className="p-4 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white shadow-lg transition-all hover:scale-105 active:scale-95 border-2 border-white/50"
          title="Open AI Assistant"
      >
          <Brain className="w-6 h-6" />
      </button>
    </div>
  );
};

export default MainHeader;