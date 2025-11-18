// src/context/PatientEncounterContext.jsx
import React, { useState, useContext, createContext } from 'react';
import UIContext from './UIContext';
import { generateAICase } from '../services/firestoreService'; // Import new AI function

const PatientEncounterContext = createContext();

export const PatientEncounterProvider = ({ children }) => {
  const uiContext = useContext(UIContext);
  const [activeCase, setActiveCase] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [caseHistory, setCaseHistory] = useState([]);
  
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCase = async (topic) => {
    setIsGenerating(true);
    try {
      const newCase = await generateAICase(topic);
      
      if (!newCase || !newCase.steps || newCase.steps.length === 0) {
        alert("AI failed to generate a valid case. Please try again.");
        return;
      }

      setActiveCase(newCase);
      setCurrentStep(0);
      setCaseHistory([]);
      
      if (uiContext) {
        uiContext.setCurrentView('patient-encounters');
      }
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Could not generate case. Check API connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCaseAction = (label, nextStep) => {
    if (!activeCase?.steps?.[currentStep]) return;

    const currentStepData = activeCase.steps[currentStep];
    setCaseHistory(prev => [...prev, { step: currentStepData.title, actionTaken: label }]);
    
    // 100 = Success/End, 99 = Fail/Exit
    if (nextStep >= 99) {
      alert(nextStep === 100 ? "Case Completed Successfully!" : "Incorrect decision. Patient outcome compromised.");
      setActiveCase(null);
      if (uiContext) uiContext.setCurrentView('home');
    } else {
      if (activeCase.steps[nextStep]) {
        setCurrentStep(nextStep);
      } else {
        // Fallback if AI hallucinated a step number
        alert("Simulation complete.");
        setActiveCase(null);
        if (uiContext) uiContext.setCurrentView('home');
      }
    }
  };

  return (
    <PatientEncounterContext.Provider value={{ 
      activeCase, currentStep, caseHistory, 
      isGenerating, generateCase, 
      handleCaseAction 
    }}>
      {children}
    </PatientEncounterContext.Provider>
  );
};

export default PatientEncounterContext;