// src/views/SubjectTestView.jsx
import React, { useContext, useState, useMemo, useEffect } from 'react';
import { Target, ChevronRight, Clock } from 'lucide-react';
import UIContext from '../context/UIContext';
import QuizContext from '../context/QuizContext';
import MetadataContext from '../context/MetadataContext';
import { Q_BANK_SOURCES } from '../constants/data';

// Subject icons mapping (same emojis)
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

// Icon background colors
const ICON_COLORS = {
  'Anatomy': 'bg-pink-200',
  'Physiology': 'bg-blue-200',
  'Pharmacology': 'bg-purple-200',
  'Biochemistry': 'bg-teal-200',
  'Pathology': 'bg-yellow-200',
  'Microbiology': 'bg-green-200',
  'Medicine': 'bg-indigo-200',
  'Surgery': 'bg-red-200',
  'Obstetrics & Gyn': 'bg-pink-300',
  'Pediatrics': 'bg-yellow-300',
  'Ophthalmology': 'bg-purple-300',
  'ENT': 'bg-orange-200',
  'Dermatology': 'bg-cyan-200',
  'Psychiatry': 'bg-pink-300',
  'Orthopedics': 'bg-orange-300',
  'Radiology': 'bg-blue-300',
  'Anesthesia': 'bg-cyan-300'
};

const SubjectTestView = () => {
  const { getTextColor, getCardStyle, isDarkMode } = useContext(UIContext);
  const { startQuiz } = useContext(QuizContext);
  const { allSubjects = [], metadataLoading = true } = useContext(MetadataContext) || {};
  
  const [selectedSources, setSelectedSources] = useState([]);
  const [isStrictTiming, setIsStrictTiming] = useState(false);

  const CardStyle = getCardStyle();

  // Auto-select all sources on mount
  useEffect(() => {
    setSelectedSources(Q_BANK_SOURCES);
  }, []);

  // DYNAMIC: Filter subjects by selected sources
  const filteredSubjects = useMemo(() => {
    if (selectedSources.length === 0) return [];
    
    // Group subjects by name and aggregate data from selected sources
    const subjectMap = new Map();
    
    allSubjects
      .filter(s => selectedSources.includes(s.source))
      .forEach(subj => {
        if (!subjectMap.has(subj.name)) {
          subjectMap.set(subj.name, {
            name: subj.name,
            totalQuestions: 0,
            totalModules: 0,
            sources: []
          });
        }
        
        const existing = subjectMap.get(subj.name);
        
        // Calculate totals
        const questionCount = Object.values(subj.subtopics || {}).reduce((sum, val) => sum + val, 0);
        const moduleCount = Object.keys(subj.modules || {}).length;
        
        existing.totalQuestions += questionCount;
        existing.totalModules += moduleCount;
        existing.sources.push(subj.source);
      });
    
    return Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSubjects, selectedSources]);

  const toggleSource = (source) => {
    setSelectedSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const handleStartSubjectTest = (subjectName) => {
    startQuiz({
      subject: subjectName,
      count: 50,
      sources: selectedSources,
      strictTiming: isStrictTiming,
      timer: isStrictTiming ? 50 * 60 : null // 50 minutes for 50 qs
    });
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-7 h-7 text-blue-500" />
              <h1 className="text-3xl font-bold" style={{ color: getTextColor() }}>
                Subject/Topic Tests
              </h1>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Take a quick <strong>50-question test</strong> focused purely on a single Subject. Sources:{' '}
              <span className="text-purple-500 font-medium">
                {Q_BANK_SOURCES.map((src, idx) => (
                  <span key={src}>
                    {src}{idx < Q_BANK_SOURCES.length - 1 ? ', ' : '.'}
                  </span>
                ))}
              </span>
            </p>
          </div>
          
          {/* Timed Toggle */}
          <button
            onClick={() => setIsStrictTiming(!isStrictTiming)}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${
               isStrictTiming
                 ? 'bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-500/20'
                 : isDarkMode 
                   ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500' 
                   : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
            }`}
          >
            <Clock className={`w-5 h-5 ${isStrictTiming ? 'animate-pulse' : ''}`} />
            <div className="text-left">
              <span className="block font-bold text-sm">Timed Mode</span>
              <span className="text-xs opacity-80">{isStrictTiming ? 'On (Strict)' : 'Off'}</span>
            </div>
          </button>
        </div>

        {/* Source Selection Badges */}
        <div className="flex flex-wrap gap-2">
          {Q_BANK_SOURCES.map((source) => (
            <button
              key={source}
              onClick={() => toggleSource(source)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                selectedSources.includes(source)
                  ? 'bg-purple-500 text-white shadow-md'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {source}
            </button>
          ))}
        </div>

        {/* Subject Cards Grid */}
        {selectedSources.length === 0 ? (
          <div className={`${CardStyle.bg} ${CardStyle.border} p-8 rounded-xl text-center`}>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Please select at least one source to view subjects.
            </p>
          </div>
        ) : metadataLoading ? (
          <div className={`${CardStyle.bg} ${CardStyle.border} p-8 rounded-xl text-center`}>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Loading subjects...
            </p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className={`${CardStyle.bg} ${CardStyle.border} p-8 rounded-xl text-center`}>
            <p className="text-amber-500">
              No subjects found for selected sources.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((subject) => (
              <div
                key={subject.name}
                className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-2xl shadow-md hover:shadow-lg transition group`}
              >
                {/* Icon */}
                <div className={`w-16 h-16 ${ICON_COLORS[subject.name] || 'bg-gray-200'} rounded-2xl flex items-center justify-center mb-4`}>
                  <span className="text-3xl">{SUBJECT_ICONS[subject.name] || '📚'}</span>
                </div>

                {/* Subject Name */}
                <h3 className="text-xl font-bold mb-2" style={{ color: getTextColor() }}>
                  {subject.name}
                </h3>

                {/* Stats */}
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {subject.totalQuestions} Questions | {subject.totalModules} Modules
                </p>

                {/* Start Button */}
                <button
                  onClick={() => handleStartSubjectTest(subject.name)}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium text-purple-600 hover:bg-purple-50 transition group-hover:bg-purple-500 group-hover:text-white"
                >
                  <span>Start Quick Test</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectTestView;