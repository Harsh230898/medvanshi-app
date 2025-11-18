// src/views/PatientEncountersView.jsx
import React, { useContext, useState, useEffect } from 'react';
import { UserCheck, Maximize2, Layers, Loader2, PlusCircle, Play, ArrowLeft, Brain, Sparkles, AlertTriangle, RefreshCcw } from 'lucide-react';
import UIContext from '../context/UIContext';
import PatientEncounterContext from '../context/PatientEncounterContext';
import { seedClinicalCase } from '../services/firestoreService';

const PatientEncountersView = () => {
  const { getTextColor, getCardStyle, isDarkMode } = useContext(UIContext);
  const { 
    activeCase, currentStep, caseHistory, 
    availableCases = [], 
    casesLoading, refreshCases,
    startEncounter, handleCaseAction,
    isGenerating, generateCase 
  } = useContext(PatientEncounterContext);
  const CardStyle = getCardStyle();
  
  const [customTopic, setCustomTopic] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    setRenderError(null);
  }, [activeCase]);

  const QUICK_TOPICS = ["Myocardial Infarction", "Stroke", "DKA", "Trauma", "Pneumonia"];

  const handleGenerateAI = async (topic) => {
    if (!topic) return;
    if (generateCase) {
        await generateCase(topic);
    } else {
        alert("AI service unavailable. Please refresh.");
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    const success = await seedClinicalCase();
    if (success) {
      await refreshCases();
      alert("Sample Case added to library!");
    } else {
      alert("Failed to add case.");
    }
    setIsSeeding(false);
  };

  const isValidCase = activeCase && activeCase.steps && Array.isArray(activeCase.steps) && activeCase.steps.length > 0;
  
  // --- 1. DASHBOARD VIEW ---
  if (!activeCase || !isValidCase) {
    return (
      // FIX: Removed h-full and overflow-y-auto to allow normal page scrolling
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className={`text-4xl lg:text-6xl font-black mb-3 ${getTextColor('text-slate-900', 'text-white')}`}>
            Virtual Patient Encounters
          </h2>
          <p className={getTextColor('text-xl text-slate-600', 'text-slate-400')}>
            High-fidelity clinical case simulations.
          </p>
        </div>

        {/* AI Generator */}
        <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 mb-8 border shadow-xl`}>
           <h3 className="text-2xl font-black flex items-center gap-3 mb-6 text-purple-600 dark:text-purple-400">
             <Brain className="w-8 h-8" /> AI Case Generator
           </h3>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="space-y-4">
               <label className="font-bold opacity-70">Enter Clinical Topic:</label>
               <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="e.g., Snake Bite, Ectopic Pregnancy..." 
                    className={`flex-1 p-4 rounded-xl border-2 font-semibold focus:outline-none focus:border-purple-500 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                  />
                  <button 
                    onClick={() => handleGenerateAI(customTopic)}
                    disabled={isGenerating || !customTopic.trim()}
                    className={`px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg transition-all ${isGenerating ? 'bg-slate-400' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105'}`}
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>}
                    Generate
                  </button>
               </div>
             </div>

             <div className="space-y-4">
                <label className="font-bold opacity-70">Quick Start:</label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TOPICS.map(t => (
                     <button 
                       key={t} 
                       onClick={() => handleGenerateAI(t)} 
                       disabled={isGenerating} 
                       className="px-4 py-2 rounded-lg bg-purple-50 dark:bg-slate-700 text-purple-700 dark:text-purple-300 font-bold text-sm hover:bg-purple-100 dark:hover:bg-slate-600 transition-colors border border-purple-200 dark:border-slate-600"
                     >
                       {t}
                     </button>
                  ))}
                </div>
             </div>
           </div>
        </div>

        {/* Library */}
        <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border shadow-xl`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-blue-500" /> Saved Library
            </h3>
            {availableCases.length === 0 && !casesLoading && (
              <button onClick={handleSeed} disabled={isSeeding} className="text-blue-600 font-bold text-sm hover:underline">
                 {isSeeding ? "Adding..." : "+ Add Sample Case"}
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {casesLoading ? (
              <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500"/> Loading...</div>
            ) : availableCases.length === 0 ? (
              <p className="text-center text-slate-500 py-10">No saved cases found. Use the AI Generator above!</p>
            ) : (
              availableCases.map(c => (
                <div key={c.id || Math.random()} className="p-5 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center hover:shadow-md transition-all">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">{c.title}</h4>
                    <p className="text-xs font-bold uppercase text-blue-500">{c.source || "AI Generated"} • {c.subject || "Medicine"}</p>
                  </div>
                  <button onClick={() => startEncounter(c)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
                    <Play className="w-4 h-4"/> Start
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // --- 2. ACTIVE ENCOUNTER VIEW ---
  const stepData = activeCase.steps[currentStep] || activeCase.steps[0];

  if (!stepData) {
     return (
        <div className="h-full flex flex-col items-center justify-center p-10 text-center">
           <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
           <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Simulation Error</h2>
           <p className="text-slate-500 mb-6">Simulation step data missing.</p>
           <button onClick={() => handleCaseAction('End', 99)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">
             Return to Dashboard
           </button>
        </div>
     );
  }

  return (
    // FIX: Removed h-full and fixed layout to allow scrolling
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Scenario Panel */}
      <div className="lg:col-span-2">
        <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-8 border border-purple-400 dark:border-purple-700 shadow-2xl`}>
          <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-xs font-bold text-purple-500 uppercase mb-1">{activeCase.source}</h3>
              <h2 className={`text-2xl font-black ${CardStyle.text}`}>{activeCase.title}</h2>
            </div>
            <button onClick={() => handleCaseAction('Exit', 99)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
              <ArrowLeft className="w-6 h-6 text-slate-500" />
            </button>
          </div>
          
          <div className="mb-8">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">Step {currentStep + 1}</span>
            <h3 className="text-2xl font-bold mt-3 mb-6 text-slate-800 dark:text-white">{stepData.title}</h3>
            <div className="p-6 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="text-lg font-medium italic leading-relaxed text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: stepData.prompt || "" }} />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-black mb-4 flex items-center gap-2 text-slate-700 dark:text-white">
              <Maximize2 className="w-5 h-5 text-rose-500"/> {stepData.action}
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {stepData.options && stepData.options.map((option, index) => (
                <button key={index} onClick={() => handleCaseAction(option.label, option.nextStep)} className={`w-full text-left p-5 rounded-xl border-2 font-bold text-lg transition-all group ${isDarkMode ? 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-purple-500 text-white' : 'bg-white border-slate-200 hover:bg-purple-50 hover:border-purple-400 text-slate-900'}`}>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-sm mr-4 group-hover:bg-purple-500 group-hover:text-white">{String.fromCharCode(65+index)}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Log Panel */}
      <div className="lg:col-span-1">
        <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl p-6 border shadow-xl h-full`}>
          <h3 className="text-xl font-black mb-4 border-b pb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-orange-500"/> Decisions</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {caseHistory.length === 0 && <div className="text-center py-20 opacity-40"><Layers className="w-12 h-12 mx-auto mb-3"/><p className="font-bold">Started</p></div>}
            {caseHistory.slice().reverse().map((item, index) => (
              <div key={index} className="p-4 border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-slate-700/40 rounded-r-xl animate-fade-in">
                <p className="font-bold text-xs uppercase text-orange-600 dark:text-orange-400 mb-1">{item.step}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.actionTaken}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PatientEncountersView;