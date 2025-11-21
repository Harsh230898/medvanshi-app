// src/views/BookmarksView.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Bookmark, Trash2, Loader2, AlertCircle, CheckCircle, BookOpen, Tag, Filter } from 'lucide-react';
import UIContext from '../context/UIContext';
import { auth } from '../services/firebase';
import { getMistakeNotebook, getQuestionsByIds, removeBookmark } from '../services/firestoreService';
import { Q_BANK_SOURCES } from '../constants/data';

const BookmarksView = () => {
  const { getTextColor, getCardStyle, isDarkMode } = useContext(UIContext);
  const CardStyle = getCardStyle();

  const [savedQuestions, setSavedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FILTERS STATE
  const [filterSource, setFilterSource] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterModule, setFilterModule] = useState('All');

  useEffect(() => {
    loadNotebook();
  }, []);

  const loadNotebook = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const savedIds = await getMistakeNotebook(auth.currentUser.uid);
      if (!savedIds || savedIds.length === 0) {
        setSavedQuestions([]);
        setLoading(false);
        return;
      }
      const questionsData = await getQuestionsByIds(savedIds);
      setSavedQuestions(questionsData.filter(q => q && q.id));
    } catch (err) {
      console.error("Error loading notebook:", err);
      setError("Failed to load your saved questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (questionId) => {
    if (!auth.currentUser) return;
    const prevQuestions = [...savedQuestions];
    setSavedQuestions(prev => prev.filter(q => q.id !== questionId));
    try {
      await removeBookmark(auth.currentUser.uid, questionId);
    } catch (err) {
      setSavedQuestions(prevQuestions); 
      alert("Failed to remove bookmark.");
    }
  };

  // FILTER LOGIC
  const availableSubjects = [...new Set(savedQuestions.map(q => q.subject).filter(Boolean))];
  const availableModules = [...new Set(savedQuestions.map(q => q.module).filter(Boolean))];

  const filteredQuestions = savedQuestions.filter(q => {
      const matchSource = filterSource === 'All' || q.source === filterSource;
      const matchSubject = filterSubject === 'All' || q.subject === filterSubject;
      const matchModule = filterModule === 'All' || q.module === filterModule;
      return matchSource && matchSubject && matchModule;
  });

  return (
    <div className="h-full overflow-y-auto p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black flex items-center gap-3" style={{ color: getTextColor() }}>
            <Bookmark className="w-8 h-8 text-yellow-500 fill-current" /> Mistake Notebook
            </h1>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Review difficult questions you saved for later.</p>
        </div>
        
        {/* FILTERS UI */}
        {savedQuestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
                <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className={`p-2 rounded-lg border text-sm font-bold outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}>
                    <option value="All">All Sources</option>
                    {Q_BANK_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className={`p-2 rounded-lg border text-sm font-bold outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}>
                    <option value="All">All Subjects</option>
                    {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterModule} onChange={e => setFilterModule(e.target.value)} className={`p-2 rounded-lg border text-sm font-bold outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}>
                    <option value="All">All Modules</option>
                    {availableModules.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500">Loading your notebook...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-red-50 dark:bg-red-900/20 text-center text-red-500"><AlertCircle className="w-8 h-8 mx-auto mb-2" />{error}</div>
      ) : filteredQuestions.length === 0 ? (
        <div className={`${CardStyle.bg} ${CardStyle.border} p-12 rounded-3xl text-center`}>
          <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-xl font-bold mb-2 ${CardStyle.text}`}>{savedQuestions.length === 0 ? "Your notebook is empty" : "No matches found"}</h3>
          <p className="text-gray-500">{savedQuestions.length === 0 ? "Flag questions during a quiz to review them here later." : "Try adjusting your filters."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredQuestions.map((q, idx) => (
            <div key={q.id || idx} className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-2xl shadow-sm relative group transition-all hover:shadow-md`}>
              <button onClick={() => handleRemove(q.id)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors" title="Remove"><Trash2 className="w-5 h-5" /></button>

              <div className="flex flex-wrap gap-2 mb-4 pr-10">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                   <Tag className="w-3 h-3"/> {q.source || 'General'}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                   {q.subject || 'Subject'}
                </span>
                {q.module && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {q.module}
                    </span>
                )}
              </div>

              <h3 className={`text-lg font-bold mb-4 ${CardStyle.text}`}>{idx + 1}. {q.question}</h3>
              {q.questionImage && <img src={q.questionImage} alt="Reference" className="max-h-60 rounded-lg mb-4 border border-gray-200 dark:border-gray-700"/>}

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-1">Correct Answer</p>
                    <p className="text-gray-800 dark:text-gray-200">{(q.options && q.options[q.answer - 1]) || `Option ${String.fromCharCode(65 + (q.answer - 1))}`}</p>
                  </div>
                </div>
              </div>

              {q.explanation && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-2 text-gray-500"><BookOpen className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wider">Explanation</span></div>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarksView;