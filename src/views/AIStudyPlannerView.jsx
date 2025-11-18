// src/views/AIStudyPlannerView.jsx
import React, { useState, useContext } from 'react';
import { Calendar, Clock, Brain, CheckCircle, AlertCircle, Loader2, ArrowRight, BookOpen } from 'lucide-react';
import UIContext from '../context/UIContext';
import AuthContext from '../context/AuthContext';
import { generateStudyPlan } from '../services/firestoreService';

const AIStudyPlannerView = () => {
  const { getTextColor, getCardStyle, isDarkMode } = useContext(UIContext);
  const { user } = useContext(AuthContext);
  const CardStyle = getCardStyle();

  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState(4);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!examDate) {
      setError("Please select your exam date.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateStudyPlan(user.uid, examDate, dailyHours);
      if (result && result.plan) {
        setPlan(result);
      } else if (result.error) {
        setError(result.error);
      } else {
        setError("Failed to generate plan. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred while communicating with the AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-10">
        <h2 className={`text-4xl lg:text-6xl font-black mb-3 ${getTextColor('text-slate-900', 'text-white')}`}>
          AI Study Planner
        </h2>
        <p className={getTextColor('text-xl text-slate-600', 'text-slate-400')}>
          Your personalized roadmap to success, powered by AI.
        </p>
      </div>

      {!plan ? (
        <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border shadow-xl max-w-2xl`}>
          <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-500" /> Setup Your Schedule
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-2">
                When is your Exam?
              </label>
              <input 
                type="date" 
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className={`w-full p-4 rounded-xl border-2 font-bold outline-none focus:border-purple-500 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-2">
                Daily Study Hours: <span className="text-purple-500">{dailyHours} hrs</span>
              </label>
              <input 
                type="range" 
                min="1" max="12" 
                value={dailyHours}
                onChange={(e) => setDailyHours(e.target.value)}
                className="w-full accent-purple-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5" /> {error}
              </div>
            )}

            <button 
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-black text-lg text-white shadow-lg flex items-center justify-center gap-3 transition-all ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-[1.02]'}`}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Brain className="w-6 h-6" />}
              {loading ? "Analyzing Weaknesses..." : "Generate Smart Schedule"}
            </button>
          </div>
        </div>
      ) : (
        // PLAN DISPLAY
        <div className="space-y-8 animate-fade-in">
          <div className="p-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl text-white shadow-2xl">
             <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
               <Brain className="w-8 h-8" /> AI Strategy Analysis
             </h3>
             <p className="text-lg opacity-90 font-medium leading-relaxed">
               {plan.summary}
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {plan.plan.map((day, idx) => (
               <div key={idx} className={`${CardStyle.bg} ${CardStyle.border} rounded-2xl p-6 border hover:shadow-lg transition-all group`}>
                 <div className="flex justify-between items-start mb-4">
                   <div className="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 font-black px-3 py-1 rounded-lg text-sm uppercase">
                     Day {day.day}
                   </div>
                   {day.date && <span className="text-xs font-bold text-slate-400">{day.date}</span>}
                 </div>
                 
                 <h4 className="text-xl font-black mb-3 text-slate-800 dark:text-white">
                   {day.focus}
                 </h4>

                 <ul className="space-y-3">
                   {day.tasks.map((task, tIdx) => (
                     <li key={tIdx} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                       <div className="mt-1 p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                       </div>
                       {task}
                     </li>
                   ))}
                 </ul>
               </div>
             ))}
          </div>

          <button 
            onClick={() => setPlan(null)}
            className="mx-auto block px-8 py-3 rounded-full border-2 border-slate-300 dark:border-slate-700 font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            Reset Plan
          </button>
        </div>
      )}
    </div>
  );
};

export default AIStudyPlannerView;