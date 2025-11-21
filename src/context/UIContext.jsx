// src/context/UIContext.jsx
import React, { useState, useEffect, createContext } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('medvanshi_theme') === 'dark';
    }
    return false;
  });
  
  // PERSISTENCE + BACK BUTTON SUPPORT
  const [currentView, setCurrentViewState] = useState(() => {
     if (typeof window !== 'undefined') {
       // 1. Check URL Hash (Priority for back button/refresh)
       const hash = window.location.hash.replace('#', '');
       if (hash) return hash;
       // 2. Check Local Storage
       return localStorage.getItem('medvanshi_current_view') || 'home';
     }
     return 'home';
  });

  // Handle Browser Back/Forward Buttons
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== currentView) {
        setCurrentViewState(hash);
      } else if (!hash) {
        setCurrentViewState('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView]);

  // Custom SetView that updates History & Storage
  const setCurrentView = (view) => {
    setCurrentViewState(view);
    if (typeof window !== 'undefined') {
      localStorage.setItem('medvanshi_current_view', view);
      // Only push if different to avoid duplicate history entries
      if (window.location.hash.replace('#', '') !== view) {
        window.history.pushState({ view }, '', `#${view}`);
      }
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('medvanshi_theme', isDarkMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
  }, [isDarkMode]);

  const getBackgroundColor = (defaultLight, defaultDark) => isDarkMode ? defaultDark : defaultLight;
  const getTextColor = (defaultLight, defaultDark) => isDarkMode ? defaultDark : defaultLight;
  const getBorderColor = (defaultLight, defaultDark) => isDarkMode ? defaultDark : defaultLight;
  
  const getCardStyle = () => ({
    bg: getBackgroundColor('bg-white/70 backdrop-blur-xl', 'bg-slate-800/80 backdrop-blur-xl'),
    border: getBorderColor('border-purple-200', 'border-purple-900'),
    text: getTextColor('text-slate-900', 'text-white'),
  });

  return (
    <UIContext.Provider value={{ 
      isDarkMode, setIsDarkMode, 
      currentView, setCurrentView, 
      isMobileMenuOpen, setIsMobileMenuOpen,
      isAppLoading, setIsAppLoading,
      isGlobalLoading, setIsGlobalLoading,
      getBackgroundColor, getTextColor, getBorderColor, getCardStyle
    }}>
      {children}
    </UIContext.Provider>
  );
};

export default UIContext;