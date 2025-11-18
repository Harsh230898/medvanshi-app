// src/views/QuizInterface.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Clock, ChevronRight, Star, Bookmark, X, CheckCircle, BookOpen, AlertTriangle } from 'lucide-react';
import QuizContext from '../context/QuizContext';
import UIContext from '../context/UIContext';
import ReviewAnalysis from '../components/ReviewAnalysis';
import ResultsView from './ResultsView';
import { auth } from '../services/firebase';
import { addBookmark, removeBookmark, getMistakeNotebook } from '../services/firestoreService';

const QuizInterface = () => {
  const {
    isQuizActive, quizQuestions, currentQuestionIndex, setCurrentQuestionIndex,
    answers, setAnswers, markings, setMarkings, timeLeftSeconds,
    submitQuiz, pauseQuizAndSave, formatTime, quizOptions
  } = useContext(QuizContext);

  const { getBackgroundColor, getCardStyle, isDarkMode, currentView, setCurrentView } = useContext(UIContext);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);

  const isStrictTiming = quizOptions?.strictTiming || quizOptions?.isGrandTest;
  const isTimed = quizOptions?.timer > 0 || timeLeftSeconds > 0;

  // Load existing bookmarks when quiz starts
  useEffect(() => {
    const loadBookmarks = async () => {
      if (auth.currentUser) {
        try {
          const savedIds = await getMistakeNotebook(auth.currentUser.uid);
          // Only keep IDs that match current quiz questions to avoid huge arrays
          const relevantBookmarks = savedIds.filter(id => 
            quizQuestions.some(q => q.id === id)
          );
          setBookmarkedQuestions(relevantBookmarks);
        } catch (error) {
          console.error("Failed to load bookmarks", error);
        }
      }
    };
    if (quizQuestions.length > 0) {
      loadBookmarks();
    }
  }, [quizQuestions]);

  // Auto-submit listener
  useEffect(() => {
    if (isTimed && isQuizActive && timeLeftSeconds <= 0) {
      submitQuiz();
    }
  }, [timeLeftSeconds, isTimed, isQuizActive, submitQuiz]);

  const toggleBookmark = async (questionId) => {
    // 1. Optimistic UI Update (Immediate)
    const isCurrentlyBookmarked = bookmarkedQuestions.includes(questionId);
    
    setBookmarkedQuestions(prev =>
      isCurrentlyBookmarked
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );

    // 2. Database Update
    if (auth.currentUser) {
      try {
        if (isCurrentlyBookmarked) {
          await removeBookmark(auth.currentUser.uid, questionId);
        } else {
          await addBookmark(auth.currentUser.uid, questionId);
        }
      } catch (error) {
        console.error("Failed to update bookmark:", error);
        // Revert on error
        setBookmarkedQuestions(prev => 
          isCurrentlyBookmarked ? [...prev, questionId] : prev.filter(id => id !== questionId)
        );
      }
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    setMarkings(prev => {
      const currentStatus = prev[questionId];
      if (currentStatus === 3 || currentStatus === 0) {
        return { ...prev, [questionId]: 1 };
      }
      return prev;
    });
  };

  const handleMarkForReview = (questionId) => {
    setMarkings(prev => {
      const isAnswered = answers[questionId] !== undefined;
      if (prev[questionId] === 2) return { ...prev, [questionId]: 1 };
      if (prev[questionId] === 3) return { ...prev, [questionId]: 0 };
      return { ...prev, [questionId]: isAnswered ? 2 : 3 };
    });
  };

  const handleClearResponse = (questionId) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionId];
      return newAnswers;
    });
    setMarkings(prev => {
      const currentStatus = prev[questionId];
      if (currentStatus === 2) return { ...prev, [questionId]: 3 };
      if (currentStatus === 1) return { ...prev, [questionId]: 0 };
      return prev;
    });
  };

  const getQuestionStatusColor = (questionId) => {
    const status = markings[questionId];
    const isCurrent = quizQuestions[currentQuestionIndex]?.id === questionId;
    const isAttempted = answers[questionId] !== undefined;

    if (isCurrent) return 'bg-purple-500 border-4 border-yellow-300 text-white shadow-xl';
    if (status === 2) return 'bg-green-500 text-white';
    if (status === 3) return 'bg-yellow-500 text-white';
    if (isAttempted) return 'bg-blue-500 text-white';
    return isDarkMode ? 'bg-slate-700 text-slate-300 border border-slate-600' : 'bg-slate-200 text-slate-800';
  };

  const CardStyle = getCardStyle();
  const currentQuestion = quizQuestions[currentQuestionIndex];

  if (!currentQuestion) {
    return <div className="text-center p-8">Loading question...</div>;
  }

  if (currentView === 'results') {
    return <ResultsView />;
  }

  const userAnswer = answers[currentQuestion.id];
  const correctAnswer = currentQuestion.answer - 1;
  const isCorrect = userAnswer === correctAnswer;

  return (
    <div className="h-full overflow-y-auto" style={{ background: getBackgroundColor() }}>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header with Timer */}
        <div className={`${CardStyle.bg} ${CardStyle.border} p-4 rounded-2xl shadow-lg flex justify-between items-center sticky top-0 z-50`}>
          <div className="flex items-center gap-4">
            {isTimed && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-xl ${
                timeLeftSeconds < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'
              }`}>
                <Clock className="w-5 h-5" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}
            {isStrictTiming && (
               <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded border border-orange-200">
                 STRICT TIMING
               </span>
            )}
          </div>
          
          <div className="flex gap-3">
            {!isStrictTiming && (
              <button
                onClick={pauseQuizAndSave}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-semibold shadow-md"
              >
                Pause
              </button>
            )}
            <button
              onClick={submitQuiz}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold shadow-md"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Question Card */}
        <div className={`${CardStyle.bg} ${CardStyle.border} p-8 rounded-3xl shadow-2xl`}>
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold" style={{ color: CardStyle.text }}>
              Question {currentQuestionIndex + 1} of {quizQuestions.length}
            </h2>
            <button
              onClick={() => toggleBookmark(currentQuestion.id)}
              className={`p-3 rounded-xl transition-all flex items-center gap-2 font-semibold ${
                bookmarkedQuestions.includes(currentQuestion.id)
                  ? 'bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-400/30 transform scale-105'
                  : isDarkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarkedQuestions.includes(currentQuestion.id) ? 'fill-current' : ''}`} />
              {bookmarkedQuestions.includes(currentQuestion.id) ? 'Saved' : 'Save'}
            </button>
          </div>

          {/* Question Text */}
          <div className="mb-6">
            <p className="text-lg leading-relaxed" style={{ color: CardStyle.text }}>
              {currentQuestion.question}
            </p>
          </div>

          {/* Question Image (if exists) */}
          {currentQuestion.questionImage && (
            <div className="mb-6">
              <img
                src={currentQuestion.questionImage}
                alt="Question"
                className="max-w-full h-auto rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const isSelected = userAnswer === index;
              const showCorrect = !isQuizActive && index === correctAnswer;
              const showIncorrect = !isQuizActive && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => isQuizActive && handleAnswerSelect(currentQuestion.id, index)}
                  disabled={!isQuizActive}
                  className={`w-full text-left p-4 rounded-xl transition border-2 ${
                    showCorrect
                      ? 'bg-green-500 border-green-600 text-white'
                      : showIncorrect
                      ? 'bg-red-500 border-red-600 text-white'
                      : isSelected
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : isDarkMode
                      ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                      : 'bg-white border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="flex-1">{option}</span>
                    {showCorrect && <CheckCircle className="w-5 h-5" />}
                    {showIncorrect && <X className="w-5 h-5" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Buttons (Only during quiz) */}
          {isQuizActive && (
            <div className="flex gap-3">
              <button
                onClick={() => handleMarkForReview(currentQuestion.id)}
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  markings[currentQuestion.id] === 2 || markings[currentQuestion.id] === 3
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : isDarkMode
                    ? 'bg-slate-700 hover:bg-slate-600'
                    : 'bg-slate-200 hover:bg-slate-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-5 h-5" />
                  Mark for Review
                </div>
              </button>
              <button
                onClick={() => handleClearResponse(currentQuestion.id)}
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  isDarkMode
                    ? 'bg-slate-700 hover:bg-slate-600'
                    : 'bg-slate-200 hover:bg-slate-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <X className="w-5 h-5" />
                  Clear Response
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Explanation Section (Only shown after quiz submission) */}
        {!isQuizActive && currentView === 'quiz' && (
          <>
            {/* Database Explanation */}
            {currentQuestion.explanation && (
              <div className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-3xl shadow-lg`}>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: CardStyle.text }}>
                  <BookOpen className="w-5 h-5" />
                  Explanation
                </h3>
                <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-base leading-relaxed`}>
                  {currentQuestion.explanation}
                </div>
              </div>
            )}

            {/* AI Analysis for Wrong Answers */}
            <ReviewAnalysis
              question={currentQuestion}
              userIncorrect={currentQuestion.id && answers[currentQuestion.id] !== currentQuestion.answer - 1}
            />
          </>
        )}

        {/* Question Navigator */}
        <div className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-3xl shadow-lg`}>
          <h3 className="text-lg font-bold mb-4" style={{ color: CardStyle.text }}>
            Question Navigator
          </h3>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {quizQuestions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`aspect-square rounded-lg font-bold text-sm transition ${getQuestionStatusColor(q.id)}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              currentQuestionIndex === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentQuestionIndex(Math.min(quizQuestions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === quizQuestions.length - 1}
            className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${
              currentQuestionIndex === quizQuestions.length - 1
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;