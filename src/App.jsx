// src/App.jsx
import React, { useContext, useState, useMemo, useEffect } from 'react';
import { Heart } from 'lucide-react';

// --- Import Contexts ---
import AuthContext from './context/AuthContext';
import UIContext from './context/UIContext';
import QuizContext from './context/QuizContext';
import FlashcardContext from './context/FlashcardContext';
import UGCContext from './context/UGCContext';
import MetadataContext from './context/MetadataContext';
import { smartSearchQuestions } from './services/firestoreService';

// --- Import Reusable Components ---
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import MainHeader from './components/MainHeader';
import SplashScreen from './components/SplashScreen';
import NotificationHub from './components/NotificationHub';

// --- Import All View (Page) Components ---
import AuthView from './views/AuthView';
import HomeView from './views/HomeView';
import QBankView from './views/QBankView';
import QuizInterface from './views/QuizInterface';
import ResultsView from './views/ResultsView';
import AIChatView from './views/AIChatView';
import AnalyticsView from './views/AnalyticsView';
import BookmarksView from './views/BookmarksView';
import ConquerModeView from './views/ConquerModeView';
import GrandTestsView from './views/GrandTestsView';
import SubjectTestView from './views/SubjectTestView';
import FlashcardsView from './views/FlashcardsView';
import FlashcardStudyView from './views/FlashcardStudyView';
import DeepDiveView from './views/DeepDiveView';
import PatientEncountersView from './views/PatientEncountersView';
import OfflineModeView from './views/OfflineModeView';
import SearchView from './views/SearchView';
import LeaderboardView from './views/LeaderboardView';
import AIStudyPlannerView from './views/AIStudyPlannerView';

const App = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const { 
    isDarkMode, isMobileMenuOpen, setIsMobileMenuOpen, 
    currentView, setCurrentView, isAppLoading, setIsAppLoading 
  } = useContext(UIContext);
  const { isQuizActive } = useContext(QuizContext);
  const { flashcardDecks } = useContext(FlashcardContext);
  const { communityMnemonics } = useContext(UGCContext);
  const { allSubjects, metadataLoading } = useContext(MetadataContext);

  // --- SAFETY TIMER FOR SPLASH SCREEN ---
  useEffect(() => {
    // 1. If metadata loads, stop loading
    if (!metadataLoading) {
      setIsAppLoading(false);
    }

    // 2. Failsafe: Force stop loading after 4 seconds even if metadata is stuck
    const safetyTimer = setTimeout(() => {
      setIsAppLoading(false);
    }, 4000);

    return () => clearTimeout(safetyTimer);
  }, [metadataLoading, setIsAppLoading]);

  // --- FULL SCREEN VIEW CONFIGURATION ---
  const isFullScreenView = isQuizActive || 
                           currentView === 'quiz' || 
                           currentView === 'results' || 
                           currentView === 'ai-chat' || 
                           currentView === 'flashcard-study';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ qbank: [], topics: [], flashcards: [], mnemonics: [] });
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setCurrentView('home');
      return;
    }
    setIsSearching(true);
    setCurrentView('search');

    const query = searchQuery.trim().toLowerCase();

    const topics = allSubjects.filter(s => 
      s.name.toLowerCase().includes(query) || 
      (s.aiSummary && s.aiSummary.toLowerCase().includes(query))
    ).map(s => ({ id: s.name, title: `${s.name} Deep Dive Hub`, snippet: 'Topic Analysis & Stats', icon: s.icon, type: 'Deep Dive Topic' }));
    
    const flashcards = flashcardDecks.filter(d => 
      d.name.toLowerCase().includes(query) || (d.keywords && d.keywords.toLowerCase().includes(query))
    ).map(d => ({ id: d.id || d.name, title: `${d.name} Deck`, count: d.cards, type: 'Private Flashcard' }));

    const mnemonics = communityMnemonics.filter(m => 
      m.text.toLowerCase().includes(query) || (m.keywords && m.keywords.toLowerCase().includes(query))
    ).map(m => ({ id: m.id, title: m.text.substring(0, 100) + '...', subject: m.subject, votes: m.votes, type: 'Community Mnemonic' }));

    let qbank = [];
    try {
      const questions = await smartSearchQuestions(searchQuery);
      qbank = questions.map(q => ({
        id: q.id,
        title: q.question.substring(0, 120) + '...',
        source: q.source,
        subject: q.subject
      }));
    } catch (err) {
      console.error("Search failed:", err);
    }

    setSearchResults({ qbank, topics, flashcards, mnemonics });
    setIsSearching(false);
  };

  const renderView = () => {
    if (isQuizActive || (currentView === 'quiz' && !isQuizActive)) return <QuizInterface />;
    if (currentView === 'results') return <ResultsView />;
    if (currentView === 'ai-chat') return <AIChatView />;
    if (currentView === 'patient-encounters') return <PatientEncountersView />;
    if (currentView === 'flashcard-study') return <FlashcardStudyView />;
    
    switch (currentView) {
      case 'home': return <HomeView />;
      case 'qbank': return <QBankView />;
      case 'analytics': return <AnalyticsView />;
      case 'leaderboard': return <LeaderboardView />;
      case 'mistakes': return <BookmarksView />;
      case 'subject-test': return <SubjectTestView />;
      case 'grand-tests': return <GrandTestsView />;
      case 'conquer-mode': return <ConquerModeView />;
      case 'deep-dive': return <DeepDiveView />;
      case 'flashcards': return <FlashcardsView />;
      case 'offline-mode': return <OfflineModeView />;
      case 'study-planner': return <AIStudyPlannerView />;
      case 'search': return <SearchView results={searchResults} query={searchQuery} loading={isSearching} />; 
      default: return <HomeView />;
    }
  };

  return (
    <div className={`flex h-screen transition-colors ${isDarkMode ? 'dark bg-slate-900 text-white' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-slate-900'}`}>
      <SplashScreen /> 
      <NotificationHub />

      {!isAppLoading && (
        isAuthenticated ? (
          <>
            <div 
              className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
                isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`} 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div 
                className={`w-72 h-full shadow-2xl transform transition-transform duration-300 ${
                  isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`} 
                onClick={(e) => e.stopPropagation()}
              >
                <Sidebar />
              </div>
            </div>

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
              {/* TopBar is now visible on patient encounters because isFullScreenView is false for it */}
              {!isFullScreenView && <TopBar />}

              <div className="flex-1 overflow-auto custom-scrollbar flex flex-col">
                <div className={`p-6 lg:p-10 ${isFullScreenView ? 'hidden' : ''}`}>
                  <MainHeader 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery} 
                    performSearch={performSearch} 
                  />
                </div>
                <div className={`flex-1 ${isFullScreenView ? 'h-full' : 'p-6 lg:p-10 pt-0'}`}>
                  {renderView()}
                </div>
                
                {!isFullScreenView && (
                  <div className="p-6 text-center text-sm font-bold text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800 mt-auto">
                    <p className="flex items-center justify-center gap-2">
                       &copy; {new Date().getFullYear()} Made with <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" /> by HD
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <AuthView />
        )
      )}
    </div>
  );
};

export default App;