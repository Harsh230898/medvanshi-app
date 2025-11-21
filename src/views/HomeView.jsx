// src/views/HomeView.jsx
import React, { useState, useContext, useEffect } from 'react';
import { 
  Clock, Award, Brain, ChevronRight, CheckSquare, TrendingUp, TrendingDown, 
  Flame, Dribbble, Zap, Trophy, CheckCircle, Play, Target, FileText, AlertCircle,
  Loader2
} from 'lucide-react';
import AuthContext from '../context/AuthContext';
import UIContext from '../context/UIContext';
import QuizContext from '../context/QuizContext';
import { updateUserGoal, getDetailedAnalytics, getMCQOfTheDay } from '../services/firestoreService';

const HomeView = () => {
  const { user } = useContext(AuthContext);
  const { getTextColor, getCardStyle, setCurrentView, isDarkMode } = useContext(UIContext);
  const { savedQuizSession, resumeQuiz, formatTime } = useContext(QuizContext);
  const CardStyle = getCardStyle();

  // --- STATE ---
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [weakestSubject, setWeakestSubject] = useState(null);
  const [goalInput, setGoalInput] = useState(user?.weeklyGoal || 200);
  
  // MCQ State
  const [mcqOfDay, setMcqOfDay] = useState(null);
  const [mcqLoading, setMcqLoading] = useState(true);
  const [mcqAnswered, setMcqAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);

  // Performance Data State
  const [performanceData, setPerformanceData] = useState({
    strengths: [],
    weaknesses: [],
    recommendations: {
        focusTopic: "General Review",
        reason: "Keep studying to generate insights.",
        nextStep: "Start a random test."
    }
  });

  // --- DATA FETCHING ---
  useEffect(() => {
    const loadDailyMCQ = async () => {
        setMcqLoading(true);
        const today = new Date().toDateString(); 
        
        let cachedMCQ = null;
        let cachedDate = null;

        if (typeof window !== 'undefined') {
            cachedMCQ = localStorage.getItem('daily_mcq_data');
            cachedDate = localStorage.getItem('daily_mcq_date');
        }

        if (cachedMCQ && cachedDate === today) {
            // Use cached version
            setMcqOfDay(JSON.parse(cachedMCQ));
            setMcqLoading(false);
        } else {
            // Fetch new one
            try {
                const q = await getMCQOfTheDay();
                if (q) {
                    setMcqOfDay(q);
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('daily_mcq_data', JSON.stringify(q));
                        localStorage.setItem('daily_mcq_date', today);
                        // Reset answer state for new day
                        localStorage.removeItem('daily_mcq_answered');
                    }
                }
            } catch (e) {
                console.error("Error loading MCQ", e);
            }
            setMcqLoading(false);
        }
    };

    const loadAnalytics = async () => {
        if (!user?.uid) return;
        try {
            const data = await getDetailedAnalytics(user.uid);
            if (data) {
                setWeeklyProgress(data.weeklyQs || 0);
                
                const subjects = Object.entries(data.subjectStats).map(([k, v]) => ({
                    subject: k, 
                    accuracy: v.total > 0 ? Math.round((v.correct/v.total)*100) : 0,
                    questionsAttempted: v.total
                })).sort((a, b) => b.accuracy - a.accuracy); 

                const strengths = subjects.filter(s => s.accuracy >= 70).slice(0, 1);
                const weaknesses = subjects.filter(s => s.accuracy < 70).reverse().slice(0, 1); 
                
                if (weaknesses.length > 0) setWeakestSubject(weaknesses[0].subject);

                setPerformanceData(prev => ({
                    ...prev,
                    strengths,
                    weaknesses,
                    recommendations: {
                        focusTopic: weaknesses.length > 0 ? weaknesses[0].subject : "General Review",
                        reason: weaknesses.length > 0 ? "Your accuracy is below 70% in high-yield modules." : "Great job! Keep solving questions to maintain your streak.",
                        nextStep: `Start a 25-question 'Hard' test.`
                    }
                }));
            }
        } catch (e) {
            console.error("Analytics error", e);
        }
    };

    if (user?.uid) {
        loadDailyMCQ();
        loadAnalytics();
    }
  }, [user]);

  // RESTORE ANSWER STATE
  useEffect(() => {
    if (typeof window !== 'undefined' && mcqOfDay) {
        const savedAnswer = localStorage.getItem('daily_mcq_answered');
        if (savedAnswer) {
            const parsed = JSON.parse(savedAnswer);
            setSelectedOption(parsed.index);
            setMcqAnswered(true);
            setIsCorrect(parsed.correct);
        }
    }
  }, [mcqOfDay]);

  const handleGoalUpdate = async () => {
     if(user?.uid) await updateUserGoal(user.uid, parseInt(goalInput));
  };

  const handleMcqSubmit = (index) => {
    if (mcqAnswered) return;
    setSelectedOption(index);
    setMcqAnswered(true);
    const correct = index === (mcqOfDay.answer - 1);
    setIsCorrect(correct);
    if (typeof window !== 'undefined') {
        localStorage.setItem('daily_mcq_answered', JSON.stringify({ index, correct }));
    }
  };

  // Placeholder Achievements
  const ACHIEVEMENTS = [
    { name: 'Streak Starter', description: 'Maintain a 7-day study streak.', icon: Flame, isAchieved: (user?.streak || 0) >= 7, color: 'text-orange-500' },
    { name: 'Marrow Master', description: 'Attempt 1000 questions from Marrow.', icon: Dribbble, isAchieved: false, color: 'text-blue-500' },
    { name: 'Anatomy Ace', description: 'Achieve 80%+ accuracy in Anatomy.', icon: Zap, isAchieved: true, color: 'text-purple-500' },
    { name: 'Grand Test Runner', description: 'Complete 3 full Grand Tests.', icon: Trophy, isAchieved: true, color: 'text-yellow-500' },
  ];

  const McqCard = () => {
    if (mcqLoading) return <div className="rounded-3xl p-8 text-white shadow-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 flex items-center justify-center h-full min-h-[320px]"><Loader2 className="w-10 h-10 animate-spin" /></div>;
    if (!mcqOfDay) return <div className="rounded-3xl p-8 text-white shadow-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 h-full min-h-[320px] flex flex-col justify-center items-center text-center"><Brain className="w-16 h-16 mb-4 text-white/80" /><h3 className="text-3xl font-bold mb-2">All Caught Up!</h3><p>Check back tomorrow for a new daily challenge.</p></div>;
    return (
      <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10 text-white shadow-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 h-full flex flex-col justify-center">
        <div className="relative z-10">
           {/* REMOVED THE SOURCE SPAN */}
           <div className="flex justify-between items-start mb-4"><span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded uppercase tracking-wider backdrop-blur-sm">MCQ OF THE DAY</span></div>
           <h3 className="text-xl lg:text-2xl font-bold mb-6 leading-snug">{mcqOfDay.question}</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {mcqOfDay.options.map((opt, idx) => {
                let btnClass = "bg-white/10 hover:bg-white/20 border-white/20 text-white";
                if (mcqAnswered) {
                  if (idx === mcqOfDay.answer - 1) btnClass = "bg-green-500 border-green-400 text-white shadow-lg scale-[1.02]";
                  else if (idx === selectedOption) btnClass = "bg-red-500 border-red-400 text-white opacity-80";
                  else btnClass = "bg-white/10 opacity-50";
                }
                return <button key={idx} onClick={() => handleMcqSubmit(idx)} disabled={mcqAnswered} className={`text-left p-4 rounded-xl border-2 transition-all font-semibold text-sm ${btnClass}`}><span className="inline-block w-6 opacity-70">{String.fromCharCode(65+idx)}.</span> {opt}</button>;
             })}
           </div>
           {mcqAnswered && <div className="mt-6 p-4 bg-black/20 rounded-xl backdrop-blur-md animate-fade-in border border-white/10"><div className="flex items-center gap-2 font-bold mb-2">{isCorrect ? <CheckCircle className="text-green-300 w-5 h-5"/> : <AlertCircle className="text-red-200 w-5 h-5"/>}{isCorrect ? "Correct Answer!" : "Incorrect"}</div><p className="text-sm opacity-90 leading-relaxed">{mcqOfDay.explanation}</p></div>}
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      </div>
    );
  };

  const HomeRecommendations = () => (
    <div className={`rounded-3xl p-8 border ${CardStyle.bg} ${CardStyle.border} bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-purple-900/30 border-purple-400 dark:border-purple-700 flex flex-col justify-between h-full`}>
      <div>
        <div className="flex items-center gap-4 mb-4"><Brain className="w-10 h-10 text-pink-600" /><h3 className={`text-2xl font-black ${getTextColor('text-slate-900', 'text-white')}`}>Smart Recommendations</h3></div>
        <p className={getTextColor('text-sm font-semibold mb-6 text-slate-600', 'text-slate-400')}>Your adaptive study plan for maximum impact:</p>
        <div className="p-4 rounded-xl bg-purple-200/50 dark:bg-purple-800/50 border border-purple-300 dark:border-purple-700 mb-4"><p className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase mb-1">Focus Topic</p><p className="text-lg font-black text-purple-900 dark:text-white">{performanceData.recommendations.focusTopic}</p></div>
        <div className="p-4 rounded-xl bg-red-200/50 dark:bg-red-800/50 border border-red-300 dark:border-red-700 mb-4"><p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase mb-1">Why?</p><p className="text-sm font-medium text-red-900 dark:text-red-100 leading-snug">{performanceData.recommendations.reason}</p></div>
      </div>
      <button onClick={() => setCurrentView('qbank')} className="w-full py-3 bg-gradient-to-r from-purple-600 to-rose-600 text-white rounded-xl font-bold hover:scale-[1.01] transition-all shadow-lg flex items-center justify-center gap-2"><span>Practice Topic</span><ChevronRight className="w-4 h-4" /></button>
    </div>
  );

  const HomeGoalSetting = () => {
      const goal = goalInput;
      const achieved = weeklyProgress;
      const percent = goal > 0 ? Math.min(100, Math.round((achieved / goal) * 100)) : 0;
      return (
        <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border h-full flex flex-col justify-center`}>
          <div className="flex items-center justify-between mb-6 border-b pb-4"><h3 className={`text-2xl font-black ${getTextColor('text-slate-900', 'text-white')} flex items-center gap-3`}><CheckSquare className="w-6 h-6 text-teal-500" /> Weekly Goal</h3><div className="flex items-center gap-2"><input type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} onBlur={handleGoalUpdate} className="w-16 p-1 text-right font-bold bg-transparent border-b border-slate-300 focus:outline-none focus:border-teal-500"/><span className="text-xs font-bold text-purple-600 cursor-pointer" onClick={handleGoalUpdate}>Save</span></div></div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-4xl font-black text-teal-500">{goal}</p><p className={getTextColor('text-sm font-semibold text-slate-600', 'text-slate-400')}>Target Qs</p></div>
            <div><p className="text-4xl font-black text-purple-500">{achieved}</p><p className={getTextColor('text-sm font-semibold text-slate-600', 'text-slate-400')}>Achieved</p></div>
            <div><p className="text-4xl font-black text-orange-500">{percent}%</p><p className={getTextColor('text-sm font-semibold text-slate-600', 'text-slate-400')}>Progress</p></div>
          </div>
          <div className="mt-6 pt-4 border-t border-purple-200 dark:border-purple-800"><div className="w-full bg-slate-200 rounded-full h-3 dark:bg-slate-700"><div className="bg-gradient-to-r from-teal-400 to-cyan-400 h-3 rounded-full" style={{ width: percent + '%' }}></div></div></div>
        </div>
      );
  };
  
  const HomeStudyTimeTracker = () => {
    const totalMinutes = user?.studyTimeMinutes || 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const weeklyGoal = 600; 
    const progressPercent = Math.min(100, (totalMinutes / weeklyGoal) * 100).toFixed(1);
    return (
      <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border h-full flex flex-col justify-center`}>
        <h3 className={`text-2xl font-black ${getTextColor('text-slate-900', 'text-white')} flex items-center gap-3 mb-6 border-b pb-4`}><Clock className="w-6 h-6 text-indigo-500" /> Study Consistency</h3>
        <div className="text-center mb-6"><p className="text-5xl font-black bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">{hours}<span className="text-2xl font-normal text-indigo-500">h</span> {minutes}<span className="text-2xl font-normal text-indigo-500">m</span></p><p className={getTextColor('text-sm font-semibold text-slate-600', 'text-slate-400')}>Total time logged this week</p></div>
        <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800"><div className="flex justify-between text-sm font-bold mb-2"><span className={getTextColor('text-slate-700', 'text-slate-300')}>Weekly Goal ({Math.floor(weeklyGoal/60)}h Target)</span><span className="text-indigo-500">{progressPercent}%</span></div><div className="w-full bg-slate-200 rounded-full h-3 dark:bg-slate-700"><div className="bg-gradient-to-r from-indigo-400 to-blue-400 h-3 rounded-full" style={{ width: progressPercent + '%' }}></div></div></div>
      </div>
    );
  };

  const HomePerformanceSummaryDetail = () => (
    <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border h-full`}>
      <h3 className={`text-2xl font-black mb-6 ${getTextColor('text-slate-900', 'text-white')} flex items-center gap-3 border-b pb-4`}><TrendingUp className="w-6 h-6 text-emerald-500" /><TrendingDown className="w-6 h-6 text-rose-500" /> Subject Performance Summary</h3>
      <div className="space-y-6">
        {performanceData.strengths.slice(0, 1).map((item, i) => (
          <div key={`s-${i}`} className={`p-6 rounded-2xl border-2 transition-colors ${isDarkMode ? 'bg-slate-700 border-emerald-800' : 'bg-emerald-50 border-emerald-300'}`}>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300 uppercase mb-2">Top Strength</p>
            <div className="flex items-center justify-between"><span className={`font-black text-2xl ${getTextColor('text-slate-900', 'text-white')}`}>{item.subject}</span><span className="text-3xl font-black text-emerald-500">{item.accuracy}%</span></div>
          </div>
        ))}
        {performanceData.weaknesses.length > 0 ? performanceData.weaknesses.slice(0, 1).map((item, i) => (
          <div key={`w-${i}`} className={`p-6 rounded-2xl border-2 transition-colors ${isDarkMode ? 'bg-slate-700 border-rose-800' : 'bg-rose-50 border-rose-300'}`}>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-300 uppercase mb-2">Biggest Weakness</p>
            <div className="flex items-center justify-between"><span className={`font-black text-2xl ${getTextColor('text-slate-900', 'text-white')}`}>{item.subject}</span><span className="text-3xl font-black text-rose-500">{item.accuracy}%</span></div>
          </div>
        )) : <div className="p-8 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-center"><p className="text-slate-500 italic">Take more tests to identify weaknesses.</p></div>}
      </div>
      <button onClick={() => setCurrentView('analytics')} className="w-full mt-8 py-4 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-xl font-bold hover:bg-purple-200 dark:hover:bg-purple-800 transition-all shadow-md text-sm uppercase tracking-wider">Go to Full Analytics</button>
    </div>
  );

  const HomeAchievements = () => (
    <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border h-full`}>
      <h3 className={getTextColor('text-2xl font-black mb-6', 'text-white') + ' flex items-center gap-3 border-b pb-4'}><Award className="w-6 h-6 text-green-500" /> Achievements</h3>
      <div className="space-y-4">
        {ACHIEVEMENTS.map((ach, i) => (
          <div key={i} className={`p-4 rounded-2xl flex items-center gap-4 transition-colors ${ach.isAchieved ? 'bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-300' : 'bg-slate-50 dark:bg-slate-700 border border-slate-300'}`}>
            <div className={`p-3 rounded-full ${ach.isAchieved ? 'bg-emerald-500' : 'bg-slate-400'}`}><ach.icon className="w-5 h-5 text-white" /></div>
            <div><p className={`font-bold ${ach.isAchieved ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>{ach.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{ach.description}</p></div>
            {ach.isAchieved && <CheckCircle className="w-6 h-6 text-emerald-500 ml-auto" />}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="mb-10">
        <h2 className={`text-3xl md:text-5xl lg:text-6xl font-black mb-3 ${getTextColor('text-slate-900', 'text-white')}`}>Welcome back, <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{user?.displayName || 'Doc'}</span>!</h2>
        <p className={getTextColor('text-xl text-slate-600', 'text-slate-400')}>Here's your personalized study dashboard</p>
      </div>
      {savedQuizSession && <div className={`p-6 rounded-3xl border border-rose-500 dark:border-rose-700 bg-rose-50/70 dark:bg-rose-900/40 shadow-xl flex justify-between items-center transition-all hover:scale-[1.01]`}><div className="flex items-center gap-4"><Clock className="w-8 h-8 text-rose-600" /><div><h3 className="text-xl font-black text-rose-800 dark:text-rose-300">Resume Incomplete Test</h3><p className="text-sm text-rose-700 dark:text-rose-400">{savedQuizSession.quizQuestions.length} Questions | Time Left: {formatTime(savedQuizSession.timeLeftSeconds)}</p></div></div><button onClick={resumeQuiz} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-md flex items-center gap-2"><Play className="w-5 h-5" /> Resume</button></div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><McqCard /></div><div className="lg:col-span-1"><HomeRecommendations /></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><HomeGoalSetting /></div><div className="lg:col-span-1"><HomeStudyTimeTracker /></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><HomePerformanceSummaryDetail /></div>
        <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[{ icon: Target, label: 'Tests', value: user?.testsCompleted || 0, color: 'from-blue-300 to-cyan-300' }, { icon: Award, label: 'Accuracy', value: (user?.overallAccuracy || 0) + '%', color: 'from-emerald-300 to-teal-300' }, { icon: Flame, label: 'Streak', value: (user?.streak || 0) + ' days', color: 'from-orange-300 to-rose-300' }, { icon: FileText, label: 'MCQs', value: user?.totalQuestions || 0, color: 'from-purple-300 to-pink-300' }].map((stat, i) => (<div key={i} className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-6 hover:shadow-xl transition-all border flex flex-col justify-center`}><div className={`p-3 bg-gradient-to-br ${stat.color} rounded-2xl shadow-lg mb-4 inline-block w-12 h-12 flex items-center justify-center`}><stat.icon className="w-6 h-6 text-white" /></div><h3 className={getTextColor('text-xs font-bold text-slate-600', 'text-slate-400') + ' mb-1'}>{stat.label}</h3><p className={getTextColor('text-3xl font-black text-slate-900', 'text-white')}>{stat.value}</p></div>))}</div>
            <HomeAchievements />
        </div>
      </div>
    </div>
  );
};

export default HomeView;