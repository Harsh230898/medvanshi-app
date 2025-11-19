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

  // --- SAFETY UPDATE START ---
  const startEncounter = (caseData) => {
    // Check if caseData exists and has steps
    if (!caseData || !caseData.steps || !Array.isArray(caseData.steps) || caseData.steps.length === 0) {
      alert("Error: This case data is incomplete. Please try another case.");
      return;
    }

    setActiveCase(caseData);
    setCurrentStep(0);
    setCaseHistory([]);
    
    if (uiContext) {
      uiContext.setCurrentView('patient-encounters');
    }
  };
  // --- SAFETY UPDATE END ---

  const generateCase = async (topic) => {
    setIsGenerating(true);
    try {
      const newCase = await generateAICase(topic);
      if (newCase && newCase.steps && newCase.steps.length > 0) {
         startEncounter(newCase);
      } else {
         alert("AI failed to generate a valid case. Please try again.");
      }
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Could not generate case. Check connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCaseAction = (label, nextStep) => {
    if (!activeCase || !activeCase.steps) return;
    
    const currentStepData = activeCase.steps[currentStep];
    if (currentStepData) {
      setCaseHistory(prev => [...prev, { step: currentStepData.title || "Step", actionTaken: label }]);
    }

    if (nextStep >= 99) {
      alert(nextStep === 100 ? "Case Completed Successfully!" : "Simulation Ended.");
      setActiveCase(null);
      if (uiContext) uiContext.setCurrentView('home');
    } else {
      if (activeCase.steps[nextStep]) {
        setCurrentStep(nextStep);
      } else {
        console.warn("Next step not found. Ending simulation.");
        setActiveCase(null);
        if (uiContext) uiContext.setCurrentView('home');
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
      startEncounter, handleCaseAction 
    }}>
      {children}
    </PatientEncounterContext.Provider>
  );
};

export default PatientEncounterContext;