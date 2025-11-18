// src/views/BookmarksView.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Bookmark, Trash2, Loader2, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';
import UIContext from '../context/UIContext';
import { auth } from '../services/firebase';
import { getMistakeNotebook, getQuestionsByIds, removeBookmark } from '../services/firestoreService';

const BookmarksView = () => {
  const { getTextColor, getCardStyle, isDarkMode } = useContext(UIContext);
  const CardStyle = getCardStyle();

  const [savedQuestions, setSavedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch questions on load
  useEffect(() => {
    loadNotebook();
  }, []);

  const loadNotebook = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      // 1. Get List of IDs from User Profile
      const savedIds = await getMistakeNotebook(auth.currentUser.uid);
      
      if (!savedIds || savedIds.length === 0) {
        setSavedQuestions([]);
        setLoading(false);
        return;
      }

      // 2. Fetch Actual Question Data
      const questionsData = await getQuestionsByIds(savedIds);
      
      // 3. FILTER OUT NULLS immediately to prevent crashes
      const validQuestions = questionsData.filter(q => q && q.id);
      
      setSavedQuestions(validQuestions);
    } catch (err) {
      console.error("Error loading notebook:", err);
      setError("Failed to load your saved questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (questionId) => {
    if (!auth.currentUser) return;
    
    // Optimistic UI Update
    const prevQuestions = [...savedQuestions];
    setSavedQuestions(prev => prev.filter(q => q.id !== questionId));

    try {
      await removeBookmark(auth.currentUser.uid, questionId);
    } catch (err) {
      console.error("Failed to remove bookmark:", err);
      // Revert if failed
      setSavedQuestions(prevQuestions); 
      alert("Failed to remove bookmark. Please check connection.");
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black flex items-center gap-3" style={{ color: getTextColor() }}>
          <Bookmark className="w-8 h-8 text-yellow-500 fill-current" />
          Mistake Notebook
        </h1>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Review difficult questions you saved for later.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500">Loading your notebook...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-red-50 dark:bg-red-900/20 text-center text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          {error}
        </div>
      ) : savedQuestions.length === 0 ? (
        <div className={`${CardStyle.bg} ${CardStyle.border} p-12 rounded-3xl text-center`}>
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className={`text-xl font-bold mb-2 ${CardStyle.text}`}>Your notebook is empty</h3>
          <p className="text-gray-500">
            Flag questions during a quiz to review them here later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* SAFETY FILTER: Ensure q exists before rendering */}
          {savedQuestions.filter(q => q && q.question).map((q, idx) => (
            <div 
              key={q.id || idx} 
              className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-2xl shadow-sm relative group transition-all hover:shadow-md`}
            >
              {/* Remove Button */}
              <button
                onClick={() => handleRemove(q.id)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                title="Remove from Notebook"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              {/* Subject Tag */}
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mb-3">
                {q.subject || 'General'}
              </span>

              {/* Question Text */}
              <h3 className={`text-lg font-bold mb-4 pr-8 ${CardStyle.text}`}>
                {idx + 1}. {q.question}
              </h3>

              {/* Image */}
              {q.questionImage && (
                <img 
                  src={q.questionImage} 
                  alt="Question Reference" 
                  className="max-h-60 rounded-lg mb-4 border border-gray-200 dark:border-gray-700"
                />
              )}

              {/* Correct Answer */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-1">Correct Answer</p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {/* Safe Access to Options array */}
                      {(q.options && q.options[q.answer - 1]) || `Option ${String.fromCharCode(65 + (q.answer - 1))}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-2 text-gray-500">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Explanation</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {q.explanation}
                  </p>
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