// src/views/GrandTestsView.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Trophy, Play, AlertCircle, Clock, FileText, Loader2, BarChart2, TrendingUp, LayoutDashboard, List } from 'lucide-react';
import UIContext from '../context/UIContext';
import QuizContext from '../context/QuizContext';
import { getGrandTests, getQuestionsByIds, getGrandTestHistory } from '../services/firestoreService';
import { auth } from '../services/firebase';

const GrandTestsView = () => {
  const { getTextColor, getCardStyle, isDarkMode } = useContext(UIContext);
  const { startQuiz, savedQuizSession } = useContext(QuizContext);
  const CardStyle = getCardStyle();

  const [activeTab, setActiveTab] = useState('tests'); // 'tests' or 'analytics'
  const [grandTests, setGrandTests] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTestId, setLoadingTestId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tests, history] = await Promise.all([
          getGrandTests(),
          auth.currentUser ? getGrandTestHistory(auth.currentUser.uid) : []
        ]);
        setGrandTests(tests);
        setAnalytics(history);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartGrandTest = async (test) => {
    setLoadingTestId(test.id);
    try {
      const questions = await getQuestionsByIds(test.question_ids);
      
      if (!questions || questions.length === 0) {
        alert("This test appears to be empty. Please contact support.");
        setLoadingTestId(null);
        return;
      }

      startQuiz({
        questions: questions,
        isGrandTest: true,
        count: questions.length,
        timer: (test.durationMinutes || 210) * 60,
        strictTiming: true,
        title: test.title || 'Grand Test'
      });
    } catch (error) {
      console.error("Error starting grand test:", error);
      alert("Failed to load test questions. Please check your internet connection.");
    } finally {
      setLoadingTestId(null);
    }
  };

  // Analytics Calculations
  const avgScore = analytics.length > 0 
    ? Math.round(analytics.reduce((acc, curr) => acc + (curr.score || 0), 0) / analytics.length) 
    : 0;
  
  const bestScore = analytics.length > 0 
    ? Math.max(...analytics.map(a => a.score || 0)) 
    : 0;

  // Aggregate Weak Subjects
  const subjectAgg = {};
  analytics.forEach(test => {
    if (test.subjectBreakdown) {
      Object.entries(test.subjectBreakdown).forEach(([sub, stats]) => {
        if (!subjectAgg[sub]) subjectAgg[sub] = { total: 0, correct: 0 };
        subjectAgg[sub].total += stats.total;
        subjectAgg[sub].correct += stats.correct;
      });
    }
  });

  const weakSubjects = Object.entries(subjectAgg)
    .map(([name, stats]) => ({ name, acc: (stats.correct / stats.total) * 100 }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 5); // Bottom 5

  return (
    <div className="max-w-7xl mx-auto p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3" style={{ color: getTextColor() }}>
            <Trophy className="w-8 h-8 text-amber-500" />
            Grand Tests
          </h1>
          <p className="opacity-70 mt-1">Full-length mock exams with advanced analytics.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'tests' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
          >
            <List className="w-4 h-4" /> Available Tests
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'analytics' ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}
          >
            <BarChart2 className="w-4 h-4" /> My Analytics
          </button>
        </div>
      </div>

      {activeTab === 'tests' ? (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-amber-500 mb-4"/>
              <p>Loading Grand Tests...</p>
            </div>
          ) : grandTests.length === 0 ? (
            <div className={`${CardStyle.bg} ${CardStyle.border} p-8 rounded-2xl text-center`}>
               <p>No Grand Tests available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grandTests.map((test) => (
                <div key={test.id} className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all group relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">FULL MOCK</div>
                  <h3 className="text-xl font-bold mb-2 pr-8" style={{ color: getTextColor() }}>{test.title}</h3>
                  <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {test.source || 'Combined'} • {test.totalQuestions || 200} MCQs
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-lg">Strict Mode</div>
                    <button
                      onClick={() => handleStartGrandTest(test)}
                      disabled={!!savedQuizSession || loadingTestId === test.id}
                      className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                        loadingTestId === test.id ? 'bg-gray-400 cursor-wait text-white' : savedQuizSession ? 'bg-gray-200 text-gray-400' : 'bg-amber-500 hover:bg-amber-600 text-white hover:scale-105 shadow-lg'
                      }`}
                    >
                      {loadingTestId === test.id ? 'Loading...' : <>Start Test <Play className="w-4 h-4 fill-current" /></>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // ANALYTICS DASHBOARD
        <div className="space-y-6">
          {analytics.length === 0 ? (
            <div className={`${CardStyle.bg} ${CardStyle.border} p-12 rounded-3xl text-center`}>
              <BarChart2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-500">No Data Available</h3>
              <p className="text-gray-400">Complete a Grand Test to see your analytics here.</p>
            </div>
          ) : (
            <>
              {/* Top Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-2xl shadow-sm`}>
                  <p className="text-sm text-gray-500 font-semibold">Tests Taken</p>
                  <p className="text-3xl font-black text-blue-500">{analytics.length}</p>
                </div>
                <div className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-2xl shadow-sm`}>
                  <p className="text-sm text-gray-500 font-semibold">Avg Score</p>
                  <p className="text-3xl font-black text-purple-500">{avgScore}</p>
                </div>
                <div className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-2xl shadow-sm`}>
                  <p className="text-sm text-gray-500 font-semibold">Best Score</p>
                  <p className="text-3xl font-black text-green-500">{bestScore}</p>
                </div>
              </div>

              {/* Score Trend Graph (Simplified CSS Bar Chart) */}
              <div className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-3xl shadow-lg`}>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" /> Score Progression
                </h3>
                <div className="h-40 flex items-end gap-2">
                  {analytics.slice().reverse().map((test, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative">
                      <div 
                        className="w-full bg-blue-500/20 hover:bg-blue-500 rounded-t-md transition-all relative group-hover:scale-y-105 origin-bottom"
                        style={{ height: `${Math.min((test.score / 800) * 100, 100)}%` }}
                      ></div>
                      <span className="text-xs mt-2 font-mono text-gray-400">{idx + 1}</span>
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap">
                        {test.testTitle}: {test.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weak Subjects */}
              <div className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-3xl shadow-lg`}>
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" /> Weakest Subjects
                </h3>
                <div className="space-y-3">
                  {weakSubjects.map((sub) => (
                    <div key={sub.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{sub.name}</span>
                        <span className="text-red-500 font-bold">{sub.acc.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${sub.acc}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GrandTestsView;