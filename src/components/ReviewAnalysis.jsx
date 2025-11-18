// src/components/ReviewAnalysis.jsx
import React, { useContext, useState, useEffect } from 'react';
import { CheckCircle, TrendingDown, Brain, Share2, ChevronRight, Activity, Link, PlusCircle, Send, BookOpen, ArrowRight } from 'lucide-react';
import UIContext from '../context/UIContext';
import UGCContext from '../context/UGCContext';
import { getGroqCompletion } from '../services/firestoreService';

const ReviewAnalysis = ({ question, userIncorrect = true }) => {
  const { getCardStyle, getTextColor, setCurrentView, isDarkMode } = useContext(UIContext);
  const { submitMnemonic } = useContext(UGCContext);
  const CardStyle = getCardStyle();

  const [cgbData, setCgbData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (userIncorrect && question) {
      setIsLoading(true);
      setCgbData(null);
      
      const sourceContext = question.source || "General Medical";
      
      // --- ENHANCED PROMPT: ASKS FOR STUDY RESOURCE ---
      const userPrompt = `
        Analyze my mistake on this ${sourceContext} question.
        
        Question: "${question.question}"
        Correct Answer: "${question.options[question.answer - 1]}"
        Explanation: "${question.explanation}"

        1. Identify the ROOT GAP (The single concept I likely misunderstood).
        2. Provide a GAP BRIDGE (One high-yield fact to fix this).
        3. STUDY RECOMMENDATION: Tell me exactly what Topic/Module to read in **${sourceContext}** to fix this.
        4. Suggest 3 RELATED CLINICAL SCENARIOS that appear frequently in ${sourceContext} exams.
      `;
      
      const systemPrompt = `
        You are an expert faculty for ${sourceContext}. 
        Output strictly valid JSON: 
        { 
          "rootGap": "Concept Name", 
          "gapConcept": "1-sentence fix.",
          "studyRecommendation": {
             "source": "${sourceContext}",
             "topic": "Specific Module/Chapter Name",
             "action": "Read/Watch this section"
          },
          "correlations": [ 
            { "type": "Similar Case", "scenario": "Brief description...", "tag": "High Yield" },
            { "type": "Contrast", "scenario": "Brief description...", "tag": "Contrast" },
            { "type": "Next Step", "scenario": "Brief description...", "tag": "Management" }
          ] 
        }
      `;

      getGroqCompletion(systemPrompt, userPrompt, true)
        .then(jsonString => {
            try { setCgbData(JSON.parse(jsonString)); } catch (e) { setCgbData({ error: "Failed to parse AI insights." }); }
        })
        .catch(err => setCgbData({ error: "AI analysis failed to load." }))
        .finally(() => setIsLoading(false));
    }
  }, [question, userIncorrect]);

  const handleAddNote = async () => {
    if (noteText.trim()) {
        await submitMnemonic({ text: noteText, subject: question.subject || 'General' });
        setNoteText('');
        setShowNoteInput(false);
        alert("Note added to Community Hub!");
    }
  };

  if (!userIncorrect) return <div className="mt-6 p-5 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/30"><h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Concept Mastered!</h3></div>;
  
  if (isLoading) return (
    <div className={`mt-6 p-6 rounded-2xl border ${CardStyle.bg} ${CardStyle.border} animate-pulse`}>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Brain className="w-5 h-5 animate-spin" /> Generating Clinical Correlations...
        </h3>
        <div className="h-2 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div className="h-2 bg-slate-200 rounded w-1/2"></div>
    </div>
  );

  if (!cgbData || cgbData.error) return <div className="mt-6 p-6 rounded-2xl border border-red-200 bg-red-50"><p className="text-red-500">Analysis Unavailable.</p></div>;

  return (
    <div className={`mt-8 p-6 rounded-3xl border shadow-sm ${CardStyle.bg} ${CardStyle.border}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg"><Activity className="w-6 h-6 text-rose-600 dark:text-rose-400" /></div>
            <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Clinical Correlation</h3>
            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Source: {question.source || 'General'}</p>
            </div>
        </div>
        <button onClick={() => setShowNoteInput(!showNoteInput)} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
            <PlusCircle className="w-4 h-4"/> Add Public Note
        </button>
      </div>

      {/* Input for UGC */}
      {showNoteInput && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl animate-fade-in">
            <p className="text-xs font-bold text-blue-600 mb-2">Share a mnemonic for this topic:</p>
            <div className="flex gap-2">
                <input 
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="e.g., Mnemonic..."
                    className={`flex-1 p-2 rounded-lg border text-sm outline-none ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
                />
                <button onClick={handleAddNote} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Send className="w-4 h-4"/></button>
            </div>
        </div>
      )}
      
      {/* CGB: Root Gap */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-2"><Brain className="w-4 h-4" /> Root Knowledge Gap</h4>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">{cgbData.rootGap}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">"{cgbData.gapConcept}"</p>
        </div>
      </div>

      {/* NEW: Study Recommendation Card */}
      {cgbData.studyRecommendation && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center justify-between group cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-300">
                 <BookOpen className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-xs font-bold text-blue-500 uppercase mb-1">Targeted Study Plan</p>
                 <h4 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Go to {cgbData.studyRecommendation.source} <ArrowRight className="w-4 h-4"/> {cgbData.studyRecommendation.topic}
                 </h4>
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cgbData.studyRecommendation.action}</p>
              </div>
           </div>
           <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
        </div>
      )}

      {/* CGB: Clinical Links */}
      <div>
        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-2"><Link className="w-4 h-4" /> Related High-Yield Patterns</h4>
        <div className="grid gap-3">
          {cgbData.correlations.map((item, i) => (
            <div key={i} className="group p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-400 transition-all bg-white dark:bg-slate-800 cursor-pointer hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${item.type === 'Related Case' ? 'bg-blue-100 text-blue-700' : item.type === 'Contrast' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{item.type}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">{item.scenario}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button onClick={() => setCurrentView('qbank')} className="text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline">Practice more {question.subject} Questions &rarr;</button>
      </div>
    </div>
  );
};

export default ReviewAnalysis;