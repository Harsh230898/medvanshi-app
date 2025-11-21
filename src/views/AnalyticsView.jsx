// src/views/AnalyticsView.jsx
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { Brain, TrendingUp, TrendingDown, Zap, Compass, Loader2, Filter, Target, Clock, Calendar, AlertTriangle, ChevronRight, List, BarChart2, History } from 'lucide-react';
import UIContext from '../context/UIContext';
import { auth } from '../services/firebase';
import { getDetailedAnalytics, getPeerBenchmarks } from '../services/firestoreService';
import { Q_BANK_SOURCES } from '../constants/data';

const AnalyticsView = () => {
  const { getTextColor, getCardStyle, isDarkMode, setCurrentView } = useContext(UIContext);
  const CardStyle = getCardStyle();
  
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [peerData, setPeerData] = useState(null);
  const [filter, setFilter] = useState('All Sources'); 
  
  // NEW: Tab State for switching between Overview and History
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchStats = async () => {
      if (auth.currentUser) {
        const [data, peers] = await Promise.all([
            getDetailedAnalytics(auth.currentUser.uid),
            getPeerBenchmarks()
        ]);
        setAnalyticsData(data);
        setPeerData(peers);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  const filteredStats = useMemo(() => {
    if (!analyticsData) return null;
    
    let userAcc = 0;
    if (filter === 'All Sources') {
        let totalCorrect = 0, totalQs = 0;
        Object.values(analyticsData.sourceStats).forEach(s => { totalCorrect += s.correct; totalQs += s.total; });
        userAcc = totalQs > 0 ? (totalCorrect / totalQs) * 100 : 0;
    } else {
        const s = analyticsData.sourceStats[filter] || { correct: 0, total: 0 };
        userAcc = s.total > 0 ? (s.correct / s.total) * 100 : 0;
    }

    const peer = peerData?.[filter] || { predictedScore: 'N/A', overallAccuracy: 0 };
    const predicted = userAcc > 0 ? Math.round(userAcc * 10 + 200) : 0; 
    const predictedRange = predicted > 0 ? `${predicted} - ${predicted + 50}` : "Take more tests";

    return { userAcc, peer, predictedRange };
  }, [analyticsData, peerData, filter]);

  const filteredCognitiveStats = useMemo(() => {
    if (!analyticsData || !analyticsData.history) return [];
    const stats = {};
    const filteredTests = analyticsData.history.filter(test => {
      if (filter === 'All Sources') return true;
      const testSource = (test.source || test.testTitle || '').toLowerCase();
      return testSource.includes(filter.toLowerCase());
    });
    filteredTests.forEach(test => {
      if (test.cognitiveBreakdown) {
        Object.entries(test.cognitiveBreakdown).forEach(([skill, data]) => {
          const cleanSkill = skill || 'Recall';
          if (!stats[cleanSkill]) stats[cleanSkill] = { correct: 0, total: 0 };
          stats[cleanSkill].correct += data.correct;
          stats[cleanSkill].total += data.total;
        });
      }
    });
    return Object.keys(stats).map(skill => ({
      skill: skill,
      accuracy: stats[skill].total > 0 ? Math.round((stats[skill].correct / stats[skill].total) * 100) : 0,
      count: stats[skill].total,
      color: skill.includes('Recall') ? 'text-emerald-500' : skill.includes('Diagnostic') ? 'text-blue-500' : 'text-rose-500'
    }));
  }, [analyticsData, filter]);

  const displayData = useMemo(() => {
    if (!analyticsData || !analyticsData.subjectStats) return null;
    const { sourceStats, subjectStats, timeStats } = analyticsData;
    
    const sourceBreakdown = Object.keys(sourceStats).map(source => ({
      name: source,
      accuracy: sourceStats[source].total > 0 ? Math.round((sourceStats[source].correct / sourceStats[source].total) * 100) : 0,
      questions: sourceStats[source].total,
    }));
    
    const subjects = Object.keys(subjectStats).map(sub => ({
      subject: sub,
      accuracy: subjectStats[sub].total > 0 ? Math.round((subjectStats[sub].correct / subjectStats[sub].total) * 100) : 0,
      questions: subjectStats[sub].total,
      avgTime: timeStats?.[sub] ? Math.round(timeStats[sub].totalTimePerQ / timeStats[sub].count) : 0
    }));
    
    const sortedSubjects = [...subjects].sort((a, b) => b.accuracy - a.accuracy);
    
    return {
      sourceBreakdown,
      strengths: sortedSubjects.filter(s => s.accuracy >= 70).slice(0, 3),
      weaknesses: sortedSubjects.filter(s => s.accuracy < 70).reverse().slice(0, 3),
      timeAnalysis: subjects.filter(s => s.avgTime > 0).sort((a, b) => b.avgTime - a.avgTime).slice(0, 5)
    };
  }, [analyticsData]);

  const ProgressRing = ({ percentage, color }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return (
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 120 120">
        <circle className="text-slate-200 dark:text-slate-700" stroke="currentColor" strokeWidth="10" fill="transparent" r={radius} cx="60" cy="60" />
        <circle className={color} stroke="currentColor" strokeWidth="10" strokeLinecap="round" fill="transparent" r={radius} cx="60" cy="60" style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-out' }} />
        <text x="60" y="60" className={`fill-current ${getTextColor('text-slate-800', 'text-white')} text-xl font-black transform rotate-90`} dominantBaseline="middle" textAnchor="middle">{`${percentage}%`}</text>
      </svg>
    );
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="w-10 h-10 animate-spin text-purple-500"/></div>;

  if (!analyticsData || !analyticsData.history || analyticsData.history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center mt-20">
        <div className={`p-12 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <div className="p-6 bg-purple-100 dark:bg-purple-900/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
             <Brain className="w-12 h-12 text-purple-500" />
          </div>
          <h2 className={`text-3xl font-black mb-3 ${getTextColor('text-slate-900', 'text-white')}`}>No Analytics Yet</h2>
          <p className="text-slate-500 mb-8 text-lg max-w-lg mx-auto">
            Your performance dashboard is waiting for data! Complete your first test to unlock predictive scoring, AI diagnostics, and speed analysis.
          </p>
          <button 
            onClick={() => setCurrentView('qbank')}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl flex items-center gap-2 mx-auto"
          >
            Start Your First Quiz <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className={`text-4xl lg:text-6xl font-black mb-3 ${getTextColor('text-slate-900', 'text-white')}`}>Advanced Analytics</h2>
            <p className={getTextColor('text-xl text-slate-600', 'text-slate-400')}>Real-time insights & Predictive Scoring.</p>
        </div>
        
        <div className="flex items-center gap-2">
             {/* Toggle Tabs */}
             <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mr-4">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
                >
                    <BarChart2 className="w-4 h-4" /> Overview
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}
                >
                    <History className="w-4 h-4" /> History
                </button>
             </div>

             {activeTab === 'overview' && (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`p-2 font-bold text-sm outline-none bg-transparent ${getTextColor('text-slate-700', 'text-white')}`}>
                    <option value="All Sources">All Sources</option>
                    {Q_BANK_SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
                    </select>
                </div>
             )}
        </div>
      </div>

      {activeTab === 'overview' ? (
        /* --- OVERVIEW DASHBOARD --- */
        <div className="space-y-8 animate-fade-in">
            {/* PREDICTIVE DASHBOARD */}
            <div className={`rounded-3xl p-8 border ${CardStyle.bg} ${CardStyle.border} bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-blue-900/20 border-blue-200 dark:border-blue-800`}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-500 rounded-xl shadow-lg text-white"><Target className="w-6 h-6" /></div>
                    <h3 className="text-2xl font-black text-blue-800 dark:text-blue-300">Predictive Score Engine</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-blue-100 dark:border-blue-900 backdrop-blur-sm">
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Your Predicted Rank Score</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-white">{filteredStats?.predictedRange}</p>
                        <p className="text-xs text-slate-500 mt-2">Based on current accuracy of {Math.round(filteredStats?.userAcc || 0)}%</p>
                    </div>
                    
                    <div className="p-6 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-purple-100 dark:border-purple-900 backdrop-blur-sm">
                        <p className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase mb-1">Peer Benchmark ({filter})</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-white">{filteredStats?.peer?.overallAccuracy || 0}%</p>
                        <p className="text-xs text-slate-500 mt-2">Avg accuracy of top 10% students</p>
                    </div>

                    <div className="p-6 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-green-100 dark:border-green-900 backdrop-blur-sm">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400 uppercase mb-1">High-Yield Gap</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-tight">
                            {Array.isArray(filteredStats?.peer?.highImpactTopics) ? filteredStats.peer.highImpactTopics.join(', ') : 'None'}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">Focus on these to boost score.</p>
                    </div>
                </div>
            </div>
            
            {/* Time Management Analysis */}
            <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border shadow-xl`}>
                <div className="flex items-center gap-3 mb-6">
                    <Clock className="w-6 h-6 text-orange-500" />
                    <h3 className={getTextColor('text-2xl font-black', 'text-white')}>Time vs. Accuracy</h3>
                </div>
                
                {displayData.timeAnalysis.length > 0 ? (
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">Avg Time per Question vs Accuracy (Top 5 Slowest Subjects)</p>
                    {displayData.timeAnalysis.map((sub, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="w-24 font-bold text-sm text-slate-600 dark:text-slate-300 truncate">{sub.subject}</div>
                        <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                            <div className="h-full bg-orange-400" style={{ width: `${Math.min((sub.avgTime / 120) * 100, 100)}%` }}></div>
                        </div>
                        <div className="w-32 text-xs font-mono text-slate-500 text-right">
                            {sub.avgTime}s <span className={sub.accuracy < 60 ? "text-red-500 font-bold" : "text-green-500"}>({sub.accuracy}%)</span>
                        </div>
                        {sub.avgTime > 90 && sub.accuracy < 60 && (
                            <AlertTriangle className="w-4 h-4 text-red-500" title="Slow & Low Accuracy (Wasted Effort)" />
                        )}
                    </div>
                    ))}
                </div>
                ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 italic">Time management data will appear here after you complete a few timed tests.</p>
                </div>
                )}
            </div>

            {/* AI Diagnostics */}
            <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border shadow-xl`}>
                <div className="flex items-center gap-3 mb-6">
                <Brain className="w-6 h-6 text-pink-500" />
                <h3 className={getTextColor('text-2xl font-black', 'text-white')}>AI Performance Diagnostics</h3>
                </div>
                
                {filteredCognitiveStats.length > 0 ? (
                <>
                    <p className={getTextColor('text-lg font-semibold mb-6 text-slate-700', 'text-slate-400')}>
                    Breakdown by **Cognitive Skill** for <span className="text-purple-500">{filter}</span>:
                    </p>
                    <div className="flex flex-wrap justify-around items-center gap-6">
                    {filteredCognitiveStats.map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 p-4">
                        <ProgressRing percentage={item.accuracy} color={item.color} />
                        <span className="font-bold text-lg text-slate-900 dark:text-white">{item.skill}</span>
                        <span className="text-xs text-slate-500">{item.count} Questions</span>
                        </div>
                    ))}
                    </div>
                </>
                ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 italic">No cognitive data available for {filter}.</p>
                </div>
                )}
            </div>

            {/* Source Breakdown */}
            <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border`}>
                <h3 className={getTextColor('text-2xl font-black mb-4', 'text-white') + ' flex gap-3'}><Compass className="text-blue-500"/> Source Breakdown</h3>
                <div className="space-y-4">
                {displayData.sourceBreakdown.length > 0 ? displayData.sourceBreakdown.map((item, i) => (
                    <div key={i} className="p-5 rounded-2xl border bg-slate-50 dark:bg-slate-700 dark:border-slate-600">
                    <div className="flex justify-between mb-2"><span className="font-bold">{item.name}</span> <span>{item.accuracy}%</span></div>
                    <div className="w-full bg-slate-200 rounded-full h-3 dark:bg-slate-600"><div className="bg-emerald-400 h-3 rounded-full" style={{ width: item.accuracy + '%' }}></div></div>
                    </div>
                )) : <p className="text-slate-500 italic">No source data available.</p>}
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border`}>
                <h3 className={getTextColor('text-2xl font-black mb-4', 'text-white') + ' flex gap-2'}><TrendingUp className="text-emerald-500"/> Top Strengths</h3>
                {displayData.strengths.length > 0 ? displayData.strengths.map((s, i) => (
                    <div key={i} className="flex justify-between p-3 border-b dark:border-slate-700">
                        <span>{s.subject}</span> <span className="font-bold text-emerald-500">{s.accuracy}%</span>
                    </div>
                )) : <p className="text-slate-500 italic">Not enough data.</p>}
                </div>
                <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border`}>
                <h3 className={getTextColor('text-2xl font-black mb-4', 'text-white') + ' flex gap-2'}><TrendingDown className="text-rose-500"/> Top Weaknesses</h3>
                {displayData.weaknesses.length > 0 ? displayData.weaknesses.map((s, i) => (
                    <div key={i} className="flex justify-between p-3 border-b dark:border-slate-700">
                        <span>{s.subject}</span> <span className="font-bold text-rose-500">{s.accuracy}%</span>
                    </div>
                )) : <p className="text-slate-500 italic">Not enough data.</p>}
                </div>
            </div>
        </div>
      ) : (
        /* --- HISTORY LIST (NEW) --- */
        <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border shadow-xl animate-fade-in`}>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                <History className="w-6 h-6 text-purple-500" /> Test History
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold">
                        <tr>
                            <th className="p-4 rounded-l-xl">Date</th>
                            <th className="p-4">Test Title</th>
                            <th className="p-4">Source</th>
                            <th className="p-4 text-center">Score</th>
                            <th className="p-4 text-center rounded-r-xl">Accuracy</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                        {analyticsData.history.slice().reverse().map((test, idx) => (
                            <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-purple-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 text-slate-500 dark:text-slate-400">
                                    {new Date(test.timestamp).toLocaleDateString()}
                                </td>
                                <td className="p-4 font-bold text-slate-800 dark:text-white">
                                    {test.testTitle || 'Custom Quiz'}
                                </td>
                                <td className="p-4 text-blue-500">
                                    {test.source || 'Mixed'}
                                </td>
                                <td className="p-4 text-center font-mono font-bold text-purple-600 dark:text-purple-400">
                                    {test.score} / {test.totalScore}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                        test.accuracy >= 70 ? 'bg-green-100 text-green-700' : 
                                        test.accuracy >= 50 ? 'bg-yellow-100 text-yellow-700' : 
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {test.accuracy}%
                                    </span>
                                </td>
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

export default AnalyticsView;