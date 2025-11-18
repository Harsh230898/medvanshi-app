// src/components/TopBar.jsx
import React, { useContext } from 'react';
import { Menu, Home, Brain } from 'lucide-react';
import UIContext from '../context/UIContext';

const TopBar = () => {
  const { setIsMobileMenuOpen, setCurrentView, isDarkMode } = useContext(UIContext);

  return (
    <div className={`backdrop-blur-lg border-b p-4 flex items-center justify-between sticky top-0 z-10 ${isDarkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/80 border-purple-200'}`}>
      <button 
        onClick={() => setIsMobileMenuOpen(true)} 
        className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'text-white hover:bg-slate-800' : 'text-slate-900 hover:bg-purple-100'}`}
        title="Open Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-lg hidden sm:block">MedVanshi</h1>
      </div>

      <button onClick={() => setCurrentView('home')} className={`p-2 rounded-xl ${isDarkMode ? 'text-white hover:bg-slate-800' : 'text-slate-900 hover:bg-purple-100'}`}>
        <Home className="w-6 h-6" />
      </button>
    </div>
  );
};

export default TopBar;