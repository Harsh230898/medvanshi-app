// src/components/SplashScreen.jsx
import React, { useContext } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import UIContext from '../context/UIContext';

const SplashScreen = () => {
  const { isAppLoading } = useContext(UIContext);

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ease-in-out"
      style={{ 
        // Deep dark background with a subtle radial gradient
        background: 'radial-gradient(circle at center, #2e1065 0%, #020617 100%)', 
        opacity: isAppLoading ? 1 : 0, 
        pointerEvents: isAppLoading ? 'auto' : 'none',
        transform: isAppLoading ? 'scale(1)' : 'scale(1.1)', // Slight zoom out on exit
      }}
    >
      {/* Ambient Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-purple-600/30 rounded-full blur-[128px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Logo Container with Glassmorphism & Float Animation */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
          <div className="relative p-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
            <Brain className="w-20 h-20 text-white drop-shadow-lg" />
            <div className="absolute -top-2 -right-2">
               <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          </div>
        </div>

        {/* Text with Gradient Reveal */}
        <div className="text-center space-y-3">
          <h1 className="text-6xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 drop-shadow-2xl">
            MedVanshi
          </h1>
          <p className="text-lg md:text-xl font-medium text-purple-200/80 tracking-widest uppercase">
            NEET PG Excellence
          </p>
        </div>
      </div>
      
      {/* Loading Bar Area */}
      <div className="absolute bottom-16 w-64 md:w-80">
        {/* Loading Text */}
        <div className="flex justify-between text-xs font-bold text-purple-300 mb-2 uppercase tracking-wider">
           <span>Initializing AI...</span>
           <span>100%</span>
        </div>
        
        {/* Progress Bar with Glow */}
        <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
          {isAppLoading && (
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]"
              style={{
                 width: '100%',
                 animation: 'loading-bar 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite' // Smoother 4.5s animation
              }}
            ></div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;