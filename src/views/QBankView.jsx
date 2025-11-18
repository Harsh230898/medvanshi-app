// src/views/QBankView.jsx
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Library, BookOpen, Target, Award, Brain, Search, Play, ChevronDown, ChevronUp, FileText, Clock } from 'lucide-react';
import UIContext from '../context/UIContext';
import QuizContext from '../context/QuizContext';
import MetadataContext from '../context/MetadataContext';
import { Q_BANK_SOURCES, DIFFICULTY_OPTIONS, COGNITIVE_SKILL_OPTIONS } from '../constants/data';

// Subject icons mapping
const SUBJECT_ICONS = {
  'Anatomy': '🦴',
  'Physiology': '⚡',
  'Pharmacology': '💊',
  'Biochemistry': '🧬',
  'Pathology': '🔬',
  'Microbiology': '🦠',
  'Medicine': '💊',
  'Surgery': '🔪',
  'Obstetrics & Gyn': '👶',
  'Pediatrics': '🧸',
  'Ophthalmology': '👁️',
  'ENT': '👂',
  'Dermatology': '💅',
  'Psychiatry': '🧠',
  'Orthopedics': '🦴',
  'Radiology': '🩻',
  'Anesthesia': '💉'
};

const QBankView = () => {
  const { getTextColor, getCardStyle, isDarkMode } = useContext(UIContext);
  const { startQuiz } = useContext(QuizContext);
  const metadata = useContext(MetadataContext) || {};
  const { allSubjects = [], metadataLoading = true } = metadata;

  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [selectedCognitiveSkill, setSelectedCognitiveSkill] = useState('');
  const [keywordQuery, setKeywordQuery] = useState('');
  const [testLength, setTestLength] = useState(50);
  const [showModules, setShowModules] = useState(false);
  const [showSubtopics, setShowSubtopics] = useState(false);
  
  // New State for Timed Mode
  const [isStrictTiming, setIsStrictTiming] = useState(false);

  const CardStyle = getCardStyle();

  // DYNAMIC: Filter subjects by selected sources only
  const filteredSubjects = useMemo(() => {
    if (selectedSources.length === 0) return [];
    return allSubjects.filter(s => selectedSources.includes(s.source));
  }, [allSubjects, selectedSources]);

  // DYNAMIC: Get unique subject names from filtered subjects
  const uniqueSubjects = useMemo(() => {
    return [...new Set(filteredSubjects.map(s => s.name))].sort();
  }, [filteredSubjects]);

  // DYNAMIC: Get current subject data from selected sources
  const currentSubjectData = useMemo(() => {
    if (!selectedSubject || selectedSources.length === 0) return null;
    
    // Get all matching subjects from selected sources
    const matchingSubjects = allSubjects.filter(
      s => s.name === selectedSubject && selectedSources.includes(s.source)
    );
    
    if (matchingSubjects.length === 0) return null;
    
    // Merge modules and subtopics from all selected sources for this subject
    const merged = {
      name: selectedSubject,
      modules: {},
      subtopics: {},
      difficulties: {},
      cognitiveSkills: {}
    };
    
    matchingSubjects.forEach(subj => {
      // Merge modules
      if (subj.modules) {
        Object.keys(subj.modules).forEach(mod => {
          merged.modules[mod] = (merged.modules[mod] || 0) + subj.modules[mod];
        });
      }
      // Merge subtopics
      if (subj.subtopics) {
        Object.keys(subj.subtopics).forEach(sub => {
          merged.subtopics[sub] = (merged.subtopics[sub] || 0) + subj.subtopics[sub];
        });
      }
    });
    
    return merged;
  }, [selectedSubject, selectedSources, allSubjects]);

  // DYNAMIC: Available modules from selected sources only
  const availableModules = useMemo(() => {
    if (!currentSubjectData || !currentSubjectData.modules) return [];
    return Object.keys(currentSubjectData.modules).sort();
  }, [currentSubjectData]);

  // DYNAMIC: Available subtopics from selected sources only
  const availableSubtopics = useMemo(() => {
    if (!currentSubjectData || !currentSubjectData.subtopics) return [];
    return Object.keys(currentSubjectData.subtopics).sort();
  }, [currentSubjectData]);

  // Reset subject/modules/subtopics when sources change
  useEffect(() => {
    setSelectedSubject('');
    setSelectedModules([]);
    setSelectedSubtopics([]);
    setShowModules(false);
    setShowSubtopics(false);
  }, [selectedSources]);

  // Reset modules/subtopics when subject changes
  useEffect(() => {
    setSelectedModules([]);
    setSelectedSubtopics([]);
    setShowModules(false);
    setShowSubtopics(false);
  }, [selectedSubject]);

  const toggleSource = (source) => {
    setSelectedSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const toggleSubject = (subjectName) => {
    setSelectedSubject(prev => prev === subjectName ? '' : subjectName);
  };

  const toggleModule = (moduleName) => {
    setSelectedModules(prev =>
      prev.includes(moduleName) ? prev.filter(m => m !== moduleName) : [...prev, moduleName]
    );
  };

  const toggleSubtopic = (subtopic) => {
    setSelectedSubtopics(prev =>
      prev.includes(subtopic) ? prev.filter(s => s !== subtopic) : [...prev, subtopic]
    );
  };

  const toggleCognitiveSkill = (skill) => {
    setSelectedCognitiveSkill(prev => prev === skill ? '' : skill);
  };

  const handleStartCustomQuiz = () => {
    if (selectedSources.length === 0 || !selectedSubject) {
      return;
    }

    const filters = {
      subject: selectedSubject,
      modules: selectedModules.length > 0 ? selectedModules : null,
      subtopics: selectedSubtopics.length > 0 ? selectedSubtopics : null,
      sources: selectedSources,
      difficulty: selectedDifficulty,
      cognitiveSkill: selectedCognitiveSkill || null,
      count: testLength,
      strictTiming: isStrictTiming, // Pass timed mode flag
      timer: isStrictTiming ? testLength * 60 : null // 1 min per question if timed
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
          <div className="grid grid-cols-4 gap-3">
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

        {/* Subject Selection - ONLY shows if sources selected */}
        {selectedSources.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold" style={{ color: getTextColor() }}>
                Subject <span className="text-sm font-normal opacity-70">(Select one - from {selectedSources.join(', ')})</span>
              </h3>
            </div>
            <div className="grid grid-cols-6 gap-3">
              {metadataLoading ? (
                <p className="col-span-6 text-center py-4 opacity-70">Loading subjects...</p>
              ) : uniqueSubjects.length === 0 ? (
                <p className="col-span-6 text-center py-4 text-amber-500">No subjects found for selected sources</p>
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

        {/* Modules Section (Collapsible) */}
        {selectedSubject && availableModules.length > 0 && (
          <div>
            <button
              onClick={() => setShowModules(!showModules)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition border-2 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 hover:border-green-500'
                  : 'bg-white border-gray-300 hover:border-green-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-bold" style={{ color: getTextColor() }}>
                  Modules <span className="text-sm font-normal opacity-70">(Optional - {selectedModules.length} selected)</span>
                </h3>
              </div>
              {showModules ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {showModules && (
              <div className="mt-3 grid grid-cols-3 gap-2 p-4 rounded-xl border-2 max-h-64 overflow-y-auto" style={{
                borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb'
              }}>
                {availableModules.map((moduleName) => (
                  <button
                    key={moduleName}
                    onClick={() => toggleModule(moduleName)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition border-2 ${
                      selectedModules.includes(moduleName)
                        ? 'bg-green-500 border-green-500 text-white'
                        : isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-green-500'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-green-500'
                    }`}
                  >
                    {moduleName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subtopics Section (Collapsible) */}
        {selectedSubject && availableSubtopics.length > 0 && (
          <div>
            <button
              onClick={() => setShowSubtopics(!showSubtopics)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition border-2 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 hover:border-indigo-500'
                  : 'bg-white border-gray-300 hover:border-indigo-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold" style={{ color: getTextColor() }}>
                  Subtopics <span className="text-sm font-normal opacity-70">(Optional - {selectedSubtopics.length} selected)</span>
                </h3>
              </div>
              {showSubtopics ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {showSubtopics && (
              <div className="mt-3 grid grid-cols-4 gap-2 p-4 rounded-xl border-2 max-h-64 overflow-y-auto" style={{
                borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb'
              }}>
                {availableSubtopics.map((subtopic) => (
                  <button
                    key={subtopic}
                    onClick={() => toggleSubtopic(subtopic)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition border-2 ${
                      selectedSubtopics.includes(subtopic)
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-indigo-500'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-500'
                    }`}
                  >
                    {subtopic}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filters and Settings Grid */}
        <div className="grid grid-cols-2 gap-6">
           {/* Difficulty Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-bold" style={{ color: getTextColor() }}>
                Difficulty
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {DIFFICULTY_OPTIONS.map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className={`px-4 py-3 rounded-xl font-semibold transition border-2 ${
                    selectedDifficulty === difficulty
                      ? 'bg-green-500 border-green-500 text-white'
                      : isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-green-500'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-green-500'
                  }`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          {/* Cognitive Skill Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-bold" style={{ color: getTextColor() }}>
                Cognitive Skill
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {COGNITIVE_SKILL_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleCognitiveSkill(skill)}
                  className={`px-4 py-3 rounded-xl font-semibold transition border-2 ${
                    selectedCognitiveSkill === skill
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Test Length */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-bold" style={{ color: getTextColor() }}>
              Test Length
            </h3>
          </div>
          <div className="grid grid-cols-6 gap-3">
            {[10, 25, 50, 100, 150, 200].map((length) => (
              <button
                key={length}
                onClick={() => setTestLength(length)}
                className={`px-4 py-3 rounded-xl font-semibold transition border-2 ${
                  testLength === length
                    ? 'bg-purple-500 border-purple-500 text-white'
                    : isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-purple-500'
                }`}
              >
                {length}
              </button>
            ))}
          </div>
        </div>
        
        {/* Timed Mode Toggle */}
        <div 
          onClick={() => setIsStrictTiming(!isStrictTiming)}
          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
             isStrictTiming
               ? 'bg-orange-500/10 border-orange-500'
               : isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isStrictTiming ? 'bg-orange-500 text-white' : 'bg-gray-500/20 text-gray-500'}`}>
               <Clock className="w-6 h-6" />
            </div>
            <div>
               <h3 className="font-bold text-lg" style={{ color: getTextColor() }}>Timed Mode</h3>
               <p className="text-sm opacity-70 text-gray-500 dark:text-gray-400">Auto-submit when time ends. No pause allowed.</p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full relative transition-colors ${isStrictTiming ? 'bg-orange-500' : 'bg-gray-400'}`}>
             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isStrictTiming ? 'left-7' : 'left-1'}`} />
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartCustomQuiz}
          disabled={!isTestReady}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition ${
            isTestReady
              ? isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Play className="w-6 h-6" />
          Start Custom Test ({testLength} MCQs)
        </button>

        {/* Error Message */}
        {!isTestReady && (
          <div className="text-center">
            <p className="text-sm text-red-500">
              ⚠️ Select a Subject and at least one Source to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QBankView;