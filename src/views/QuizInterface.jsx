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
    isQuizActive, setIsQuizActive, quizQuestions, currentQuestionIndex, setCurrentQuestionIndex,
    answers, setAnswers, markings, setMarkings, timeLeftSeconds,
    submitQuiz, pauseQuizAndSave, formatTime, quizOptions
  } = useContext(QuizContext);

  const { getBackgroundColor, getCardStyle, isDarkMode, currentView, setCurrentView } = useContext(UIContext);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);

  const isStrictTiming = quizOptions?.strictTiming || quizOptions?.isGrandTest;
  const isTimed = quizOptions?.timer > 0 || timeLeftSeconds > 0;

  useEffect(() => {
    const loadBookmarks = async () => {
      if (auth.currentUser) {
        const savedIds = await getMistakeNotebook(auth.currentUser.uid);
        setBookmarkedQuestions(savedIds.filter(id => quizQuestions.some(q => q.id === id)));
      }
    };
    if (quizQuestions && quizQuestions.length > 0) loadBookmarks();
  }, [quizQuestions]);

  useEffect(() => {
    if (isTimed && isQuizActive && timeLeftSeconds <= 0) submitQuiz();
  }, [timeLeftSeconds, isTimed, isQuizActive, submitQuiz]);

  const toggleBookmark = async (questionId) => {
    const isCurrentlyBookmarked = bookmarkedQuestions.includes(questionId);
    setBookmarkedQuestions(prev => isCurrentlyBookmarked ? prev.filter(id => id !== questionId) : [...prev, questionId]);
    if (auth.currentUser) {
       isCurrentlyBookmarked ? await removeBookmark(auth.currentUser.uid, questionId) : await addBookmark(auth.currentUser.uid, questionId);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    setMarkings(prev => {
      const currentStatus = prev[questionId];
      if (currentStatus === 3 || currentStatus === 0) return { ...prev, [questionId]: 1 };
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

  // --- EMERGENCY EXIT IF DATA MISSING ---
  if (!currentQuestion) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
         <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4 animate-pulse">
            <AlertTriangle className="w-10 h-10 text-red-500" />
         </div>
         <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">Test Data Unavailable</h3>
         <p className="text-slate-500 mb-6">We couldn't recover the questions for this session.</p>
         <button 
           onClick={() => {
             setIsQuizActive(false);
             setCurrentView('home');
             // Force clear potentially corrupt state
             if (typeof window !== 'undefined') localStorage.setItem('quiz_active', 'false');
           }} 
           className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors"
         >
           Return to Dashboard
         </button>
      </div>
    );
  }

  if (currentView === 'results') return <ResultsView />;

  const userAnswer = answers[currentQuestion.id];
  const correctAnswer = currentQuestion.answer - 1;
  const isCorrect = userAnswer === correctAnswer;

  return (
    <div className="h-full overflow-y-auto" style={{ background: getBackgroundColor() }}>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        
        {/* Header */}
        <div className={`${CardStyle.bg} ${CardStyle.border} p-3 md:p-4 rounded-2xl shadow-lg flex justify-between items-center sticky top-0 z-40`}>
          <div className="flex items-center gap-3">
            {isTimed && <div className="flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 rounded-xl font-mono font-bold text-lg bg-blue-50 text-blue-600"><Clock className="w-4 h-4" /><span>{formatTime(timeLeftSeconds)}</span></div>}
            {isStrictTiming && <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded border border-orange-200 hidden md:block">STRICT</span>}
          </div>
          <div className="flex gap-2">
            {!isStrictTiming && <button onClick={pauseQuizAndSave} className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold">Pause</button>}
            <button onClick={submitQuiz} className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-bold">Submit</button>
          </div>
        </div>

        {/* Question Card */}
        <div className={`${CardStyle.bg} ${CardStyle.border} p-5 md:p-8 rounded-3xl shadow-2xl`}>
          <div className="flex justify-between items-start mb-4 md:mb-6">
            <h2 className="text-lg md:text-2xl font-bold" style={{ color: CardStyle.text }}>Q. {currentQuestionIndex + 1}</h2>
            <button onClick={() => toggleBookmark(currentQuestion.id)} className={`p-2 md:p-3 rounded-xl transition-all ${bookmarkedQuestions.includes(currentQuestion.id) ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-100 text-slate-500'}`}><Bookmark className="w-5 h-5" /></button>
          </div>
          <div className="mb-6"><p className="text-base md:text-lg leading-relaxed" style={{ color: CardStyle.text }}>{currentQuestion.question}</p></div>
          {currentQuestion.questionImage && <div className="mb-6"><img src={currentQuestion.questionImage} alt="Question" className="max-w-full h-auto rounded-lg shadow-md max-h-60 object-contain mx-auto" /></div>}

          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const isSelected = userAnswer === index;
              const showCorrect = !isQuizActive && index === correctAnswer;
              const showIncorrect = !isQuizActive && isSelected && !isCorrect;
              return (
                <button key={index} onClick={() => isQuizActive && handleAnswerSelect(currentQuestion.id, index)} disabled={!isQuizActive} className={`w-full text-left p-3 md:p-4 rounded-xl transition border-2 ${showCorrect ? 'bg-green-500 border-green-600 text-white' : showIncorrect ? 'bg-red-500 border-red-600 text-white' : isSelected ? 'bg-blue-500 border-blue-600 text-white' : isDarkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-white border-slate-300 hover:bg-slate-100'}`}>
                  <div className="flex items-center gap-3"><span className="font-bold text-lg">{String.fromCharCode(65 + index)}.</span><span className="flex-1 text-sm md:text-base">{option}</span>{showCorrect && <CheckCircle className="w-5 h-5" />}{showIncorrect && <X className="w-5 h-5" />}</div>
                </button>
              );
            })}
          </div>

          {isQuizActive && (
            <div className="flex gap-3">
              <button onClick={() => handleMarkForReview(currentQuestion.id)} className="flex-1 py-3 rounded-xl font-semibold bg-yellow-500 text-white text-sm">Mark Review</button>
              <button onClick={() => handleClearResponse(currentQuestion.id)} className="flex-1 py-3 rounded-xl font-semibold bg-slate-500 text-white text-sm">Clear</button>
            </div>
          )}
        </div>
        
        {/* Review Section */}
        {!isQuizActive && (
            <div className="animate-fade-in">
                {currentQuestion.explanation ? (
                    <div className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-3xl shadow-lg mb-6`}>
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: CardStyle.text }}>
                        <BookOpen className="w-5 h-5" /> Explanation
                        </h3>
                        <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-base leading-relaxed`}>
                        {currentQuestion.explanation}
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 mb-6 text-center text-yellow-700 dark:text-yellow-300">
                        <p>No written explanation available.</p>
                    </div>
                )}

                <ReviewAnalysis
                    question={currentQuestion}
                    userIncorrect={currentQuestion.id && answers[currentQuestion.id] !== correctAnswer}
                />
            </div>
        )}

        {/* Navigator */}
        <div className={`${CardStyle.bg} ${CardStyle.border} p-4 md:p-6 rounded-3xl shadow-lg`}>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-4">
            {quizQuestions.map((q, idx) => (
              <button key={q.id} onClick={() => setCurrentQuestionIndex(idx)} className={`aspect-square rounded-lg font-bold text-xs md:text-sm transition ${getQuestionStatusColor(q.id)}`}>{idx + 1}</button>
            ))}
          </div>
        </div>
        <div className="flex justify-between pb-10">
          <button onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))} disabled={currentQuestionIndex === 0} className="px-6 py-3 rounded-xl font-semibold bg-blue-500 text-white disabled:bg-slate-300">Previous</button>
          <button onClick={() => setCurrentQuestionIndex(Math.min(quizQuestions.length - 1, currentQuestionIndex + 1))} disabled={currentQuestionIndex === quizQuestions.length - 1} className="px-6 py-3 rounded-xl font-semibold bg-blue-500 text-white disabled:bg-slate-300">Next</button>
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;