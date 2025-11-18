// src/views/OfflineModeView.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Zap, Wifi, WifiOff, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import UIContext from '../context/UIContext';

const OfflineModeView = () => {
  const { getTextColor, getCardStyle } = useContext(UIContext);
  const CardStyle = getCardStyle();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Capture PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        }
        setInstallPrompt(null);
      });
    } else {
      alert("To install: Tap the 'Share' icon (iOS) or 'Three Dots' (Android/Chrome) and select 'Add to Home Screen'.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="mb-10">
        <h2 className={`text-4xl lg:text-6xl font-black mb-3 ${getTextColor('text-slate-900', 'text-white')}`}>
          Offline Mode
        </h2>
        <p className={getTextColor('text-xl text-slate-600', 'text-slate-400')}>
          Access your study materials anywhere, anytime.
        </p>
      </div>

      {/* Network Status Card */}
      <div className={`p-8 rounded-3xl border-2 transition-colors ${isOnline ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-rose-400 bg-rose-50 dark:bg-rose-900/20'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-full ${isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
             {isOnline ? <Wifi className="w-8 h-8" /> : <WifiOff className="w-8 h-8" />}
          </div>
          <div>
            <h3 className={`font-black text-2xl mb-1 ${isOnline ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>
              You are currently {isOnline ? 'Online' : 'Offline'}
            </h3>
            <p className="text-sm opacity-80">
              {isOnline 
                ? "Data is syncing. Quizzes you take now will be cached for later."
                : "You are using cached data. Flashcards and recently viewed tests work offline."}
            </p>
          </div>
        </div>
      </div>

      {/* PWA Install Card */}
      <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Zap className="w-10 h-10 text-purple-500" />
            <div>
              <h3 className={`font-black text-2xl mb-1 ${CardStyle.text}`}>Install App</h3>
              <p className={`text-sm ${getTextColor('text-slate-600', 'text-slate-400')}`}>
                Install MedVanshi on your device for a full-screen experience and faster loading.
              </p>
            </div>
          </div>
          <button 
            onClick={handleInstallClick}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            {installPrompt ? "Install App" : "How to Install"}
          </button>
        </div>
      </div>

      {/* Cache Status Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-2xl border`}>
            <h4 className="font-bold text-lg mb-2 flex items-center gap-2 text-blue-500">
              <CheckCircle className="w-5 h-5" /> Smart Caching Active
            </h4>
            <p className="text-sm opacity-70">
              Your <strong>Flashcards</strong>, <strong>Test History</strong>, and <strong>Recent Questions</strong> are automatically saved to your device.
            </p>
         </div>
         <div className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-2xl border`}>
            <h4 className="font-bold text-lg mb-2 flex items-center gap-2 text-orange-500">
              <AlertTriangle className="w-5 h-5" /> Offline Limitations
            </h4>
            <p className="text-sm opacity-70">
              <strong>Grand Tests</strong> and <strong>New Questions</strong> require an internet connection to load for the first time.
            </p>
         </div>
      </div>
    </div>
  );
};

export default OfflineModeView;