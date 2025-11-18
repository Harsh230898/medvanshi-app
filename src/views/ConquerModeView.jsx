// src/views/ConquerModeView.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Target, BookOpen, Zap, Brain, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import UIContext from '../context/UIContext';
import QuizContext from '../context/QuizContext';
import AuthContext from '../context/AuthContext';
import { getAdaptiveTestStrategy } from '../services/firestoreService';
import { Q_BANK_SOURCES } from '../constants/data';

const ConquerModeView = () => {
  const { getTextColor, getCardStyle, isDarkMode } = useContext(UIContext);
  const { startQuiz } = useContext(QuizContext);
  const { user } = useContext(AuthContext);
  const CardStyle = getCardStyle();

  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState(null);
  const [conquerSource, setConquerSource] = useState('All Sources');

  // 1. Fetch Adaptive Strategy on Mount
  useEffect(() => {
    const fetchStrategy = async () => {
      if (user && user.uid) {
        const data = await getAdaptiveTestStrategy(user.uid);
        setStrategy(data);
      }
      setLoading(false);
    };
    fetchStrategy();
  }, [user]);

  const handleStartAdaptiveQuiz = () => {
    if (!strategy) return;

    // Smart Configuration based on Strategy
    const filters = {
      count: 20, // Shorter, focused bursts
      difficulty: 'Hard', // Always challenge in Conquer Mode
      sources: conquerSource === 'All Sources' ? Q_BANK_SOURCES : [conquerSource]
    };

    // If we have specific weak subjects, filter by them
    if (strategy.mode === 'Targeted' && strategy.focusSubjects && strategy.focusSubjects.length > 0) {
      filters.subject = strategy.focusSubjects[0]; // Focus on the #1 weakness
    }

    startQuiz(filters);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-10">
        <h2 className={`text-4xl lg:text-6xl font-black mb-3 ${getTextColor('text-slate-900', 'text-white')}`}>Conquer Mode</h2>
        <p className={getTextColor('text-xl text-slate-600', 'text-slate-400')}>
          AI-driven adaptive learning pathway. We identify your gaps, you conquer them.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Strategy Card */}
        <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border shadow-xl relative overflow-hidden`}>
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <Zap className="w-32 h-32 text-yellow-500" />
           </div>
           
           <h3 className="text-2xl font-black mb-6 flex items-center gap-3 z-10 relative">
             <Brain className="w-8 h-8 text-purple-500" /> Your Personalized Plan
           </h3>

           <div className="space-y-6 z-10 relative">
             <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
               <p className="text-sm font-bold text-purple-600 dark:text-purple-300 uppercase mb-1">Current Strategy</p>
               <p className="text-xl font-black text-slate-800 dark:text-white">
                 {strategy?.mode === 'Targeted' ? '🎯 Precision Gap Filling' : '🌐 Baseline Calibration'}
               </p>
             </div>

             <div>
               <p className="font-bold text-slate-600 dark:text-slate-400 mb-2">Focus Areas:</p>
               {strategy?.focusSubjects ? (
                 <div className="flex flex-wrap gap-2">
                   {strategy.focusSubjects.map(sub => (
                     <span key={sub} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg font-bold text-sm border border-red-200 dark:border-red-800">
                       {sub}
                     </span>
                   ))}
                 </div>
               ) : (
                 <p className="text-sm text-slate-500 italic">General high-yield mix (No specific weaknesses detected yet)</p>
               )}
             </div>

             <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
               <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
               <p className="text-sm text-blue-800 dark:text-blue-200 font-medium leading-relaxed">
                 {strategy?.reason}
               </p>
             </div>
           </div>
        </div>

        {/* Action Card */}
        <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border shadow-xl flex flex-col justify-center`}>
           <div className="mb-8">
             <label className="block font-bold text-slate-600 dark:text-slate-400 mb-3">Target QBank Source (Optional)</label>
             <select 
               value={conquerSource}
               onChange={(e) => setConquerSource(e.target.value)}
               className={`w-full p-4 rounded-xl border-2 font-bold outline-none focus:border-purple-500 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
             >
               <option value="All Sources">All Sources (Recommended)</option>
               {Q_BANK_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>

           <button 
             onClick={handleStartAdaptiveQuiz}
             className="w-full py-5 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white rounded-2xl font-black text-xl hover:scale-[1.02] transition-all shadow-2xl flex items-center justify-center gap-3"
           >
             <Zap className="w-6 h-6 fill-current" />
             Start Conquer Session
           </button>
           <p className="text-center text-xs font-bold text-slate-400 mt-4 uppercase tracking-widest">20 Questions • High Yield • Adaptive</p>
        </div>

      </div>
    </div>
  );
};

export default ConquerModeView;