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
  
  const [currentView, setCurrentView] = useState('home');
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