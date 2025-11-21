// src/context/QuizContext.jsx
import React, { useState, useContext, createContext, useEffect, useCallback } from 'react';
import UIContext from './UIContext';
import NotificationContext from './NotificationContext';
import { getQuestions } from '../services/firestoreService';
import { TIME_PER_QUESTION_SECONDS, TOTAL_TEST_MINUTES } from '../constants/data';

const QuizContext = createContext();

export const QuizProvider = ({ children }) => {
  const uiContext = useContext(UIContext);
  const notificationContext = useContext(NotificationContext);
  
  // Helper to load state safely from LocalStorage
  const loadState = (key, def) => {
    if (typeof window === 'undefined') return def;
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : def;
    } catch (e) {
      return def;
    }
  };

  const [isQuizActive, setIsQuizActive] = useState(() => loadState('quiz_active', false));
  const [quizQuestions, setQuizQuestions] = useState(() => loadState('quiz_questions', []));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => loadState('quiz_index', 0));
  const [answers, setAnswers] = useState(() => loadState('quiz_answers', {}));
  const [markings, setMarkings] = useState(() => loadState('quiz_markings', {}));
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(() => loadState('quiz_timer', 0));
  const [initialTimeSeconds, setInitialTimeSeconds] = useState(() => loadState('quiz_initial_time', 0));
  const [quizOptions, setQuizOptions] = useState(() => loadState('quiz_options', {}));
  
  const [savedQuizSession, setSavedQuizSession] = useState(null);
  const [showImageQuestions, setShowImageQuestions] = useState(true); // Image Toggle

  // --- PERSISTENCE EFFECT ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz_active', JSON.stringify(isQuizActive));
      localStorage.setItem('quiz_questions', JSON.stringify(quizQuestions));
      localStorage.setItem('quiz_index', JSON.stringify(currentQuestionIndex));
      localStorage.setItem('quiz_answers', JSON.stringify(answers));
      localStorage.setItem('quiz_markings', JSON.stringify(markings));
      localStorage.setItem('quiz_timer', JSON.stringify(timeLeftSeconds));
      localStorage.setItem('quiz_initial_time', JSON.stringify(initialTimeSeconds));
      localStorage.setItem('quiz_options', JSON.stringify(quizOptions));
    }
  }, [isQuizActive, quizQuestions, currentQuestionIndex, answers, markings, timeLeftSeconds, quizOptions]);

  // --- SAFETY CHECK (Fix Loading Loop) ---
  useEffect(() => {
    // If app thinks quiz is active but data is empty/corrupt, RESET it.
    if (isQuizActive && (!quizQuestions || quizQuestions.length === 0)) {
      console.warn("Quiz state corrupted (Active but no questions). Resetting...");
      setIsQuizActive(false);
      setSavedQuizSession(null);
      if (typeof window !== 'undefined') {
        localStorage.setItem('quiz_active', 'false');
        localStorage.removeItem('quiz_questions');
      }
    }
  }, [isQuizActive, quizQuestions]);

  const submitQuiz = useCallback(() => {
    setIsQuizActive(false);
    setSavedQuizSession(null);
    if (typeof window !== 'undefined') {
        localStorage.setItem('quiz_active', 'false');
    }
    uiContext?.setCurrentView('results');
    notificationContext?.addNotification("Test submitted successfully!", 'success');
  }, [uiContext, notificationContext]);

  useEffect(() => {
    let timerId;
    if (isQuizActive && timeLeftSeconds > 0) {
      timerId = setInterval(() => {
        setTimeLeftSeconds(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeftSeconds === 0 && isQuizActive) {
      notificationContext?.addNotification("Time's up! Submitting...", 'info');
      submitQuiz();
    }
    return () => clearInterval(timerId);
  }, [isQuizActive, timeLeftSeconds, notificationContext, submitQuiz]);

  const startQuiz = async (filters = {}) => {
    if (savedQuizSession) {
      notificationContext?.addNotification("Please resume or submit your saved test first.", 'error');
      return;
    }

    uiContext?.setIsGlobalLoading(true); 
    try {
      let questions = await getQuestions(filters);

      // LOGIC: Remove images if toggle is FALSE
      if (!showImageQuestions) {
         questions = questions.filter(q => !q.questionImage);
      }

      if (questions.length === 0) {
        notificationContext?.addNotification("No questions found. Try enabling images or changing filters.", 'error');
        return;
      }

      if (questions.length > filters.count) {
          questions = questions.slice(0, filters.count);
      }

      setQuizQuestions(questions);
      setAnswers({});
      setMarkings(questions.reduce((acc, q) => ({ ...acc, [q.id]: 0 }), {}));
      setCurrentQuestionIndex(0);
      setQuizOptions(filters);
      
      const isGrandTest = filters.isGrandTest || false;
      let totalTime = filters.timer 
        ? filters.timer 
        : (isGrandTest ? TOTAL_TEST_MINUTES * 60 : questions.length * TIME_PER_QUESTION_SECONDS);
      
      setTimeLeftSeconds(totalTime);
      setInitialTimeSeconds(totalTime);
      
      uiContext?.setCurrentView('quiz');
      setIsQuizActive(true);
      notificationContext?.addNotification(`Test started (${questions.length} Qs).`, 'success');
      
    } catch (error) {
      console.error("Failed to start quiz:", error);
      notificationContext?.addNotification("Error loading questions. Check connection.", 'error');
    } finally {
      uiContext?.setIsGlobalLoading(false); 
    }
  };

  const resumeQuiz = () => {
    if (!savedQuizSession) return;
    setQuizQuestions(savedQuizSession.quizQuestions);
    setAnswers(savedQuizSession.answers);
    setMarkings(savedQuizSession.markings);
    setCurrentQuestionIndex(savedQuizSession.currentQuestionIndex);
    setTimeLeftSeconds(savedQuizSession.timeLeftSeconds);
    setInitialTimeSeconds(savedQuizSession.initialTimeSeconds || 3600);
    setQuizOptions(savedQuizSession.quizOptions || {});
    setSavedQuizSession(null); 
    uiContext?.setCurrentView('quiz');
    setIsQuizActive(true);
  };

  const pauseQuizAndSave = () => {
    if (!isQuizActive) return;
    setSavedQuizSession({ quizQuestions, answers, markings, currentQuestionIndex, timeLeftSeconds, initialTimeSeconds, quizOptions, timestamp: Date.now() });
    setIsQuizActive(false);
    uiContext?.setCurrentView('home'); 
    notificationContext?.addNotification("Test paused and saved.", 'info');
  };

  const calculateResults = () => {
    let score = 0, attempted = 0, correct = 0, incorrect = 0;
    quizQuestions.forEach(q => {
      const userChoice = answers[q.id];
      if (userChoice !== undefined) {
        attempted++;
        if (userChoice + 1 === q.answer) { correct++; score += 4; } else { incorrect++; score -= 1; }
      }
    });
    return { score, totalQuestions: quizQuestions.length, attempted, correct, incorrect, timeSpentSeconds: initialTimeSeconds - timeLeftSeconds };
  };

  const formatTime = (s) => {
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    return h>0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  return (
    <QuizContext.Provider value={{
      isQuizActive, setIsQuizActive,
      quizQuestions, setQuizQuestions,
      currentQuestionIndex, setCurrentQuestionIndex,
      answers, setAnswers,
      markings, setMarkings,
      timeLeftSeconds, setTimeLeftSeconds,
      initialTimeSeconds,
      savedQuizSession, setSavedQuizSession,
      quizOptions,
      showImageQuestions, setShowImageQuestions,
      startQuiz, resumeQuiz, pauseQuizAndSave, submitQuiz,
      calculateResults, formatTime
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export default QuizContext;