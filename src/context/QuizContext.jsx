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
  
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]); 
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markings, setMarkings] = useState({});
  
  // Timer State
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [initialTimeSeconds, setInitialTimeSeconds] = useState(0); // NEW: To calc time spent
  
  const [savedQuizSession, setSavedQuizSession] = useState(null);
  const [quizOptions, setQuizOptions] = useState({}); // Store title/source

  const submitQuiz = useCallback(() => {
    setIsQuizActive(false);
    setSavedQuizSession(null);
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
      notificationContext?.addNotification("Time's up! Submitting your test...", 'info');
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
      const questions = await getQuestions(filters);

      if (questions.length === 0) {
        notificationContext?.addNotification("No questions found for your filters.", 'error');
        return;
      }

      setQuizQuestions(questions);
      setAnswers({});
      setMarkings(questions.reduce((acc, q) => ({ ...acc, [q.id]: 0 }), {}));
      setCurrentQuestionIndex(0);
      setQuizOptions(filters); // Save options for ResultsView
      
      const isGrandTest = filters.isGrandTest || false;
      // Default time or Custom time passed in filters
      let totalTime = filters.timer 
        ? filters.timer 
        : (isGrandTest ? TOTAL_TEST_MINUTES * 60 : questions.length * TIME_PER_QUESTION_SECONDS);
      
      setTimeLeftSeconds(totalTime);
      setInitialTimeSeconds(totalTime); // NEW
      
      uiContext?.setCurrentView('quiz');
      setIsQuizActive(true);
      notificationContext?.addNotification(`Test started (${questions.length} Qs). Good luck!`, 'success');
      
    } catch (error) {
      console.error("Failed to start quiz:", error);
      notificationContext?.addNotification("Error loading questions. Check filters or connection.", 'error');
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
    setInitialTimeSeconds(savedQuizSession.initialTimeSeconds || 3600); // Fallback
    setQuizOptions(savedQuizSession.quizOptions || {});
    setSavedQuizSession(null); 
    
    uiContext?.setCurrentView('quiz');
    setIsQuizActive(true);
    notificationContext?.addNotification("Test resumed.", 'info');
  };

  const pauseQuizAndSave = () => {
    if (!isQuizActive) return;
    const session = {
        quizQuestions,
        answers,
        markings,
        currentQuestionIndex,
        timeLeftSeconds,
        initialTimeSeconds,
        quizOptions,
        timestamp: Date.now(),
    };
    setSavedQuizSession(session);
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
        if (userChoice + 1 === q.answer) {
          correct++;
          score += 4;
        } else {
          incorrect++;
          score -= 1;
        }
      }
    });
    
    // NEW: Calculate Time Spent
    const timeSpentSeconds = initialTimeSeconds - timeLeftSeconds;
    
    return { 
        score, 
        totalQuestions: quizQuestions.length, 
        attempted, 
        correct, 
        incorrect,
        timeSpentSeconds // Return time
    };
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <QuizContext.Provider value={{
      isQuizActive, setIsQuizActive,
      quizQuestions, setQuizQuestions,
      currentQuestionIndex, setCurrentQuestionIndex,
      answers, setAnswers,
      markings, setMarkings,
      timeLeftSeconds, setTimeLeftSeconds,
      initialTimeSeconds, // Exported
      savedQuizSession, setSavedQuizSession,
      quizOptions, // Exported
      startQuiz, resumeQuiz, pauseQuizAndSave, submitQuiz,
      calculateResults, formatTime
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export default QuizContext;