// src/views/ResultsView.jsx
import React, { useContext, useMemo, useEffect, useRef } from 'react';
import { Trophy, BookOpen, Maximize2, PieChart, Brain, Clock } from 'lucide-react';
import QuizContext from '../context/QuizContext';
import UIContext from '../context/UIContext';
import { auth } from '../services/firebase';
import { saveGrandTestResult } from '../services/firestoreService';

const ResultsView = () => {
  const { setIsQuizActive, setCurrentQuestionIndex, quizQuestions, answers, quizOptions, initialTimeSeconds, timeLeftSeconds } = useContext(QuizContext);
  const { getBackgroundColor, getCardStyle, getTextColor, setCurrentView } = useContext(UIContext);
  const savedRef = useRef(false); 

  // 1. Calculate Stats
  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    let score = 0;

    quizQuestions.forEach(q => {
      const userAnswer = answers[q.id];
      const correctAnswer = q.answer - 1;

      if (userAnswer === undefined || userAnswer === null) {
        unattempted++;
      } else if (userAnswer === correctAnswer) {
        correct++;
        score += 4;
      } else {
        incorrect++;
        score -= 1;
      }
    });

    const totalQuestions = quizQuestions.length;
    const maxScore = totalQuestions * 4;
    const percentage = totalQuestions > 0 ? ((score / maxScore) * 100).toFixed(2) : 0;
    
    // NEW: Time Stats
    const timeTaken = initialTimeSeconds - timeLeftSeconds;
    const avgTimePerQ = totalQuestions > 0 ? Math.round(timeTaken / totalQuestions) : 0;

    return { correct, incorrect, unattempted, score, totalQuestions, percentage, timeTaken, avgTimePerQ };
  }, [quizQuestions, answers, initialTimeSeconds, timeLeftSeconds]);

  // 2. Calculate Breakdowns
  const { subjectBreakdown, cognitiveBreakdown } = useMemo(() => {
    const subjMap = {};
    const cogMap = {};

    quizQuestions.forEach(q => {
       // Subject
       const sub = q.subject || 'Unknown';
       if (!subjMap[sub]) subjMap[sub] = { total: 0, correct: 0, incorrect: 0, unattempted: 0 };
       
       // Cognitive
       const skill = q.cognitive_skill || 'Recall';
       if (!cogMap[skill]) cogMap[skill] = { total: 0, correct: 0, incorrect: 0, unattempted: 0 };

       // Update Counts
       [subjMap[sub], cogMap[skill]].forEach(record => {
         record.total++;
         const userAnswer = answers[q.id];
         const correctAnswer = q.answer - 1;

         if (userAnswer === undefined) record.unattempted++;
         else if (userAnswer === correctAnswer) record.correct++;
         else record.incorrect++;
       });
    });

    return { subjectBreakdown: subjMap, cognitiveBreakdown: cogMap };
  }, [quizQuestions, answers]);

  // 3. Auto-Save
  useEffect(() => {
    const saveToDB = async () => {
      if ((quizOptions?.isGrandTest || quizQuestions.length >= 5) && auth.currentUser && !savedRef.current) {
        savedRef.current = true;
        await saveGrandTestResult(auth.currentUser.uid, {
          score: stats.score,
          totalScore: stats.totalQuestions * 4,
          accuracy: stats.percentage,
          correct: stats.correct,
          incorrect: stats.incorrect,
          timeTaken: stats.timeTaken, // <--- SAVING TIME
          avgTimePerQ: stats.avgTimePerQ, // <--- SAVING SPEED
          subjectBreakdown: subjectBreakdown, 
          cognitiveBreakdown: cognitiveBreakdown,
          testTitle: quizOptions.title || 'Custom Quiz',
          source: quizOptions.sources ? quizOptions.sources[0] : 'Mixed',
          subject: quizOptions.subject || 'Mixed' // Save main subject if exists
        });
      }
    };
    saveToDB();
  }, [quizOptions, stats, subjectBreakdown, cognitiveBreakdown, quizQuestions.length]);

  const CardStyle = getCardStyle();
  const breakdownArray = subjectBreakdown ? Object.entries(subjectBreakdown).sort((a, b) => b[1].total - a[1].total) : [];

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className={`max-w-5xl mx-auto p-6 lg:p-10 ${getBackgroundColor('', 'bg-slate-900')} h-full overflow-y-auto`}>
      
      <div className={`text-center ${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 lg:p-10 shadow-2xl mb-8`}>
        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
        <h2 className={`text-4xl lg:text-5xl font-black mb-2 ${CardStyle.text}`}>Test Completed!</h2>
        <p className={getTextColor('text-xl text-slate-600', 'text-slate-400') + ' mb-8'}>Performance Summary</p>

        <div className="grid grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
          <div className="bg-blue-50/70 dark:bg-blue-900/50 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
            <p className="text-4xl font-black text-blue-600 dark:text-blue-300">{stats.score}</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Total Score</p>
          </div>
          <div className="bg-emerald-50/70 dark:bg-emerald-900/50 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <p className="text-4xl font-black text-emerald-600 dark:text-emerald-300">{stats.percentage}%</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Accuracy</p>
          </div>
          {/* NEW: Time Stat */}
          <div className="bg-orange-50/70 dark:bg-orange-900/50 p-6 rounded-2xl border border-orange-100 dark:border-orange-800">
            <p className="text-4xl font-black text-orange-600 dark:text-orange-300">{formatTime(stats.timeTaken)}</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Time Taken</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center max-w-2xl mx-auto">
          <button onClick={() => setCurrentView('qbank')} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl inline-flex items-center justify-center gap-2">
            <BookOpen className="w-5 h-5" /> <span>Back to QBank</span>
          </button>
          <button onClick={() => { setCurrentView('quiz'); setIsQuizActive(false); setCurrentQuestionIndex(0); }} className="flex-1 bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl inline-flex items-center justify-center gap-2">
            <Maximize2 className="w-5 h-5" /> <span>Review Qs</span>
          </button>
        </div>
      </div>

      {/* AI Diagnostics Preview */}
      <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 shadow-xl mb-8 border border-purple-200 dark:border-purple-800`}>
        <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-purple-600 dark:text-purple-400">
           <Brain className="w-6 h-6" /> AI Diagnostics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(cognitiveBreakdown).map(([skill, data]) => (
            <div key={skill} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
               <p className="text-sm text-slate-500 uppercase font-bold">{skill}</p>
               <p className="text-2xl font-black text-slate-800 dark:text-white">
                 {data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0}%
               </p>
               <p className="text-xs text-slate-400">{data.correct}/{data.total} Correct</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Breakdown */}
      {breakdownArray.length > 0 && (
        <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 shadow-xl mb-8`}>
          <div className="flex items-center gap-3 mb-6">
             <PieChart className="w-6 h-6 text-purple-500" />
             <h3 className={`text-2xl font-bold ${CardStyle.text}`}>Subject-wise Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 text-sm uppercase tracking-wider">
                   <th className="py-3 px-4">Subject</th>
                   <th className="py-3 px-4 text-center">Total</th>
                   <th className="py-3 px-4 text-center text-green-600">Correct</th>
                   <th className="py-3 px-4 text-center text-red-600">Wrong</th>
                   <th className="py-3 px-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {breakdownArray.map(([subject, data]) => (
                  <tr key={subject} className={`border-b border-slate-100 dark:border-slate-800 last:border-0`}>
                    <td className={`py-3 px-4 font-medium ${CardStyle.text}`}>{subject}</td>
                    <td className={`py-3 px-4 text-center font-bold ${CardStyle.text}`}>{data.total}</td>
                    <td className="py-3 px-4 text-center text-green-500 font-bold">{data.correct}</td>
                    <td className="py-3 px-4 text-center text-red-500 font-bold">{data.incorrect}</td>
                    <td className={`py-3 px-4 text-right font-black ${CardStyle.text}`}>{(data.correct * 4) - (data.incorrect)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsView;