// src/views/QBankView.jsx
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Library, BookOpen, Target, Award, Brain, Search, Play, ChevronDown, ChevronUp, FileText, Clock, Image } from 'lucide-react';
import UIContext from '../context/UIContext';
import QuizContext from '../context/QuizContext';
import MetadataContext from '../context/MetadataContext';
import { Q_BANK_SOURCES, DIFFICULTY_OPTIONS, COGNITIVE_SKILL_OPTIONS } from '../constants/data';

const SUBJECT_ICONS = {
  'Anatomy': '🦴', 'Physiology': '⚡', 'Pharmacology': '💊', 'Biochemistry': '🧬', 'Pathology': '🔬', 'Microbiology': '🦠', 'Medicine': '💊', 'Surgery': '🔪', 'Obstetrics & Gyn': '👶', 'Pediatrics': '🧸', 'Ophthalmology': '👁️', 'ENT': '👂', 'Dermatology': '💅', 'Psychiatry': '🧠', 'Orthopedics': '🦴', 'Radiology': '🩻', 'Anesthesia': '💉'
};

const QBankView = () => {
  const { getTextColor, getCardStyle, isDarkMode } = useContext(UIContext);
  const { startQuiz, setShowImageQuestions, showImageQuestions } = useContext(QuizContext);
  const metadata = useContext(MetadataContext) || {};
  const { allSubjects = [], metadataLoading = true } = metadata;

  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [selectedCognitiveSkill, setSelectedCognitiveSkill] = useState('');
  const [testLength, setTestLength] = useState(50);
  const [showModules, setShowModules] = useState(false);
  const [showSubtopics, setShowSubtopics] = useState(false);
  const [isStrictTiming, setIsStrictTiming] = useState(false);
  
  const CardStyle = getCardStyle();

  // Filter Logic
  const filteredSubjects = useMemo(() => {
    if (selectedSources.length === 0) return [];
    return allSubjects.filter(s => selectedSources.includes(s.source));
  }, [allSubjects, selectedSources]);

  const uniqueSubjects = useMemo(() => {
    return [...new Set(filteredSubjects.map(s => s.name))].sort();
  }, [filteredSubjects]);

  const currentSubjectData = useMemo(() => {
    if (!selectedSubject || selectedSources.length === 0) return null;
    const matchingSubjects = allSubjects.filter(s => s.name === selectedSubject && selectedSources.includes(s.source));
    if (matchingSubjects.length === 0) return null;
    const merged = { name: selectedSubject, modules: {}, subtopics: {} };
    matchingSubjects.forEach(subj => {
      if (subj.modules) Object.keys(subj.modules).forEach(mod => merged.modules[mod] = (merged.modules[mod] || 0) + subj.modules[mod]);
      if (subj.subtopics) Object.keys(subj.subtopics).forEach(sub => merged.subtopics[sub] = (merged.subtopics[sub] || 0) + subj.subtopics[sub]);
    });
    return merged;
  }, [selectedSubject, selectedSources, allSubjects]);

  const availableModules = useMemo(() => currentSubjectData?.modules ? Object.keys(currentSubjectData.modules).sort() : [], [currentSubjectData]);
  const availableSubtopics = useMemo(() => currentSubjectData?.subtopics ? Object.keys(currentSubjectData.subtopics).sort() : [], [currentSubjectData]);

  useEffect(() => { setSelectedSubject(''); setSelectedModules([]); setSelectedSubtopics([]); }, [selectedSources]);
  useEffect(() => { setSelectedModules([]); setSelectedSubtopics([]); }, [selectedSubject]);

  const toggleSource = (source) => setSelectedSources(prev => prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]);
  const toggleSubject = (subject) => setSelectedSubject(prev => prev === subject ? '' : subject);
  const toggleModule = (module) => setSelectedModules(prev => prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]);
  const toggleSubtopic = (subtopic) => setSelectedSubtopics(prev => prev.includes(subtopic) ? prev.filter(s => s !== subtopic) : [...prev, subtopic]);
  const toggleDifficulty = (difficulty) => setSelectedDifficulty(prev => prev === difficulty ? null : difficulty);
  const toggleCognitiveSkill = (skill) => setSelectedCognitiveSkill(prev => prev === skill ? '' : skill);

  const handleStartCustomQuiz = () => {
    if (selectedSources.length === 0 || !selectedSubject) return;
    const filters = {
      subject: selectedSubject,
      modules: selectedModules.length > 0 ? selectedModules : null,
      subtopics: selectedSubtopics.length > 0 ? selectedSubtopics : null,
      sources: selectedSources,
      difficulty: selectedDifficulty,
      cognitiveSkill: selectedCognitiveSkill || null,
      count: testLength,
      strictTiming: isStrictTiming,
      timer: isStrictTiming ? testLength * 60 : null
    };
    startQuiz(filters);
  };

  const isTestReady = selectedSources.length > 0 && selectedSubject;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* QBank Source Selection */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Library className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-bold" style={{ color: getTextColor() }}>
              QBank Source <span className="text-sm font-normal opacity-70">(Select at least one)</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Q_BANK_SOURCES.map((source) => (
              <button
                key={source}
                onClick={() => toggleSource(source)}
                className={`px-4 py-3 rounded-xl font-semibold transition border-2 ${
                  selectedSources.includes(source)
                    ? 'bg-purple-500 border-purple-500 text-white'
                    : isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-purple-500'
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Selection */}
        {selectedSources.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold" style={{ color: getTextColor() }}>
                Subject <span className="text-sm font-normal opacity-70">(Select one)</span>
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {metadataLoading ? (
                <p className="col-span-6 text-center py-4 opacity-70">Loading subjects...</p>
              ) : uniqueSubjects.length === 0 ? (
                <p className="col-span-6 text-center py-4 text-amber-500">No subjects found</p>
              ) : (
                uniqueSubjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    className={`p-4 rounded-xl font-semibold transition border-2 flex flex-col items-center justify-center gap-2 ${
                      selectedSubject === subject
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500'
                    }`}
                  >
                    <span className="text-2xl">{SUBJECT_ICONS[subject] || '📚'}</span>
                    <span className="text-xs text-center">{subject}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modules Section */}
        {selectedSubject && availableModules.length > 0 && (
          <div>
            <button onClick={() => setShowModules(!showModules)} className="w-full flex justify-between p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700"><div className="flex gap-2"><FileText className="w-5 h-5 text-green-500"/> Modules</div> {showModules?<ChevronUp/>:<ChevronDown/>}</button>
            {showModules && <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 p-4 rounded-xl border-2 max-h-64 overflow-y-auto">{availableModules.map(m=><button key={m} onClick={()=>toggleModule(m)} className={`px-3 py-2 rounded-lg text-sm border-2 ${selectedModules.includes(m)?'bg-green-500 text-white':'bg-white dark:bg-slate-800'}`}>{m}</button>)}</div>}
          </div>
        )}
        
        {/* Subtopics Section */}
        {selectedSubject && availableSubtopics.length > 0 && (
          <div>
            <button onClick={() => setShowSubtopics(!showSubtopics)} className="w-full flex justify-between p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700"><div className="flex gap-2"><Brain className="w-5 h-5 text-indigo-500"/> Subtopics</div> {showSubtopics?<ChevronUp/>:<ChevronDown/>}</button>
            {showSubtopics && <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 p-4 rounded-xl border-2 max-h-64 overflow-y-auto">{availableSubtopics.map(s=><button key={s} onClick={()=>toggleSubtopic(s)} className={`px-3 py-2 rounded-lg text-sm border-2 ${selectedSubtopics.includes(s)?'bg-indigo-500 text-white':'bg-white dark:bg-slate-800'}`}>{s}</button>)}</div>}
          </div>
        )}

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold mb-3" style={{ color: getTextColor() }}>Difficulty <span className="text-xs font-normal opacity-60">(Optional)</span></h3>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button key={d} onClick={() => toggleDifficulty(d)} className={`px-2 py-3 rounded-xl font-semibold border-2 text-sm transition-all ${selectedDifficulty === d ? 'bg-green-500 border-green-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 hover:border-green-500'}`}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-3" style={{ color: getTextColor() }}>Cognitive Skill <span className="text-xs font-normal opacity-60">(Optional)</span></h3>
            <div className="grid grid-cols-1 gap-2">
              {COGNITIVE_SKILL_OPTIONS.map((s) => (
                <button key={s} onClick={() => toggleCognitiveSkill(s)} className={`px-4 py-2 rounded-xl font-semibold border-2 text-sm transition-all ${selectedCognitiveSkill===s?'bg-blue-500 border-blue-500 text-white shadow-md':'bg-white dark:bg-slate-800 hover:border-blue-500'}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Test Length */}
        <div>
          <h3 className="text-lg font-bold mb-3" style={{ color: getTextColor() }}>Test Length</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[10, 25, 50, 100, 150, 200].map((length) => (
              <button key={length} onClick={() => setTestLength(length)} className={`px-4 py-3 rounded-xl font-semibold border-2 ${testLength===length?'bg-purple-500 border-purple-500 text-white shadow-md':'bg-white dark:bg-slate-800 hover:border-purple-500'}`}>{length}</button>
            ))}
          </div>
        </div>
        
        {/* Toggles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timed Mode */}
            <div onClick={() => setIsStrictTiming(!isStrictTiming)} className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between ${isStrictTiming ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500' : 'bg-white dark:bg-slate-800'}`}>
              <div className="flex items-center gap-3">
                 <Clock className={`w-6 h-6 ${isStrictTiming?'text-orange-500':'text-gray-400'}`}/>
                 <div><h3 className="font-bold">Timed Mode</h3><p className="text-xs opacity-70">Auto-submit enabled.</p></div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${isStrictTiming?'bg-orange-500':'bg-gray-300'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isStrictTiming?'left-6':'left-1'}`}/></div>
            </div>

            {/* Image Questions Toggle (UPDATED LABEL) */}
            <div onClick={() => setShowImageQuestions(!showImageQuestions)} className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between ${showImageQuestions ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : 'bg-white dark:bg-slate-800'}`}>
              <div className="flex items-center gap-3">
                 <Image className={`w-6 h-6 ${showImageQuestions?'text-blue-500':'text-gray-400'}`}/>
                 <div>
                    <h3 className="font-bold">Include Images</h3>
                    <p className="text-xs opacity-70 font-bold">
                        {showImageQuestions ? "Mixed (Text + Images)" : "Text Questions Only"}
                    </p>
                 </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${showImageQuestions?'bg-blue-500':'bg-gray-300'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showImageQuestions?'left-6':'left-1'}`}/></div>
            </div>
        </div>

        <button onClick={handleStartCustomQuiz} disabled={!isTestReady} className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition ${isTestReady ? 'bg-blue-600 text-white shadow-xl hover:scale-[1.02]' : 'bg-gray-300 cursor-not-allowed'}`}>
          <Play className="w-6 h-6" /> Start Custom Test
        </button>

        {!isTestReady && (
          <div className="text-center">
            <p className="text-sm text-red-500 font-medium animate-pulse">
              ⚠️ Select a Subject and at least one Source to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QBankView;