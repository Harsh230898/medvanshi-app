// src/context/PatientEncounterContext.jsx
import React, { useState, useContext, createContext, useEffect } from 'react';
import UIContext from './UIContext';
import { getClinicalCases, generateAICase } from '../services/firestoreService';

const PatientEncounterContext = createContext();

export const PatientEncounterProvider = ({ children }) => {
  const uiContext = useContext(UIContext);
  const [activeCase, setActiveCase] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [caseHistory, setCaseHistory] = useState([]);
  
  // NEW: Track the outcome ('success' | 'failure' | null)
  const [encounterOutcome, setEncounterOutcome] = useState(null);
  
  const [availableCases, setAvailableCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const data = await getClinicalCases();
        setAvailableCases(data || []);
      } catch (error) {
        console.error("Failed to load clinical cases", error);
        setAvailableCases([]);
      } finally {
        setCasesLoading(false);
      }
    };
    fetchCases();
  }, []);

  const startEncounter = (caseData) => {
    if (!caseData || !caseData.steps || !Array.isArray(caseData.steps) || caseData.steps.length === 0) {
      // Fallback alert only for data errors
      console.warn("Case data incomplete.");
      return;
    }
    setActiveCase(caseData);
    setCurrentStep(0);
    setCaseHistory([]);
    setEncounterOutcome(null); // Reset outcome
    
    if (uiContext) {
      uiContext.setCurrentView('patient-encounters');
    }
  };

  const endEncounter = () => {
    setActiveCase(null);
    setEncounterOutcome(null);
    setCaseHistory([]);
    if (uiContext) uiContext.setCurrentView('home');
  };

  const generateCase = async (topic) => {
    setIsGenerating(true);
    try {
      const newCase = await generateAICase(topic);
      if (newCase && newCase.steps && newCase.steps.length > 0) {
         startEncounter(newCase);
      } else {
         console.warn("AI failed to generate a valid case.");
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCaseAction = (label, nextStep) => {
    if (!activeCase || !activeCase.steps) return;
    
    const currentStepData = activeCase.steps[currentStep];
    
    // 1. Log History
    if (currentStepData) {
      setCaseHistory(prev => [...prev, { step: currentStepData.title || `Step ${currentStep + 1}`, actionTaken: label }]);
    }

    // 2. Check for End State (99 = Fail, 100 = Success)
    if (nextStep >= 99) {
        setEncounterOutcome(nextStep === 100 ? 'success' : 'failure');
    } else {
      // 3. Navigate to Next Step
      if (activeCase.steps[nextStep]) {
        setCurrentStep(nextStep);
      } else {
        console.warn(`Step ${nextStep} missing. Ending simulation.`);
        setEncounterOutcome('success'); // Default to success if path ends
      }
    }
  };

  const refreshCases = async () => {
    setCasesLoading(true);
    try {
      const data = await getClinicalCases();
      setAvailableCases(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCasesLoading(false);
    }
  };

  return (
    <PatientEncounterContext.Provider value={{ 
      activeCase, currentStep, caseHistory, 
      availableCases, casesLoading, refreshCases,
      isGenerating, generateCase, 
      startEncounter, handleCaseAction, 
      encounterOutcome, endEncounter // Exported
    }}>
      {children}
    </PatientEncounterContext.Provider>
  );
};

export default PatientEncounterContext;