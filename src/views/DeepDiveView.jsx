// src/views/DeepDiveView.jsx
import React, { useState, useContext } from 'react';
import { 
  X, Brain, TrendingUp, Target, Star, MessageSquare, ArrowUp, FileText, ChevronRight, Play, Loader2, Send, Plus
} from 'lucide-react';
import UIContext from '../context/UIContext';
import UGCContext from '../context/UGCContext';
import QuizContext from '../context/QuizContext';
import MetadataContext from '../context/MetadataContext';
import { auth } from '../services/firebase';
import { getTopicStats } from '../services/firestoreService';

const DeepDiveView = () => {
  const { getTextColor, getCardStyle, isDarkMode } = useContext(UIContext);
  const { startQuiz } = useContext(QuizContext);
  const { communityMnemonics, submitMnemonic } = useContext(UGCContext);
  const { allSubjects, metadataLoading } = useContext(MetadataContext);
  const CardStyle = getCardStyle();

  const [isDeepDiveModalOpen, setIsDeepDiveModalOpen] = useState(false);
  const [activeDeepDiveSubject, setActiveDeepDiveSubject] = useState(null);
  
  // Stats State
  const [topicStats, setTopicStats] = useState({ userAccuracy: 0, questionsAttempted: 0, totalQuestionsAvailable: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  // Mnemonic Form State
  const [newMnemonic, setNewMnemonic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openDeepDiveModal = async (subject) => {
    setActiveDeepDiveSubject(subject);
    setIsDeepDiveModalOpen(true);
    setNewMnemonic(''); // Reset form
    
    if (auth.currentUser) {
      setStatsLoading(true);
      const stats = await getTopicStats(auth.currentUser.uid, subject.name);
      setTopicStats(stats);
      setStatsLoading(false);
    }
  };
  
  const closeDeepDiveModal = () => {
    setIsDeepDiveModalOpen(false);
    setActiveDeepDiveSubject(null);
  };
  
  const handleStartSubjectTest = (subjectName) => {
    closeDeepDiveModal();
    startQuiz({ subject: subjectName, count: 10 });
  };

  const handleSubmitMnemonic = async () => {
    if (!newMnemonic.trim()) return;
    setIsSubmitting(true);
    await submitMnemonic(newMnemonic, activeDeepDiveSubject.name);
    setNewMnemonic('');
    setIsSubmitting(false);
  };

  const DeepDiveModal = () => {
    if (!activeDeepDiveSubject) return null;
    const relevantMnemonics = communityMnemonics.filter(m => m.subject === activeDeepDiveSubject.name);

    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={closeDeepDiveModal}>
        <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 shadow-2xl ${CardStyle.bg} ${CardStyle.border}`} onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${activeDeepDiveSubject.color} rounded-2xl flex items-center justify-center text-4xl shadow-lg`}>
                {activeDeepDiveSubject.icon || '📚'}
              </div>
              <div>
                <h2 className={`text-3xl font-black ${getTextColor('text-slate-900', 'text-white')}`}>{activeDeepDiveSubject.name}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-semibold">Deep Dive Hub</p>
              </div>
            </div>
            <button onClick={closeDeepDiveModal} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200"><X className="w-6 h-6" /></button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column: Stats & Actions */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                <h3 className="font-bold text-slate-500 uppercase text-xs mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Your Performance</h3>
                {statsLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                  <>
                    <div className="text-center mb-4">
                      <span className="text-4xl font-black text-blue-600 dark:text-blue-400">{topicStats.userAccuracy}%</span>
                      <p className="text-xs text-slate-500">Accuracy</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Attempted</span><span className="font-bold">{topicStats.questionsAttempted}</span></div>
                      <div className="flex justify-between"><span>Available</span><span className="font-bold">{topicStats.totalQuestionsAvailable}</span></div>
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => handleStartSubjectTest(activeDeepDiveSubject.name)} className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-2">
                <Play className="w-5 h-5" /> Start Test
              </button>
            </div>

            {/* Right Column: Content & UGC */}
            <div className="lg:col-span-2 space-y-6">
               {/* AI Summary */}
               <div className="p-6 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20">
                 <h3 className="font-bold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2"><Brain className="w-5 h-5" /> AI Topic Summary</h3>
                 <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{activeDeepDiveSubject.aiSummary || "Practice more questions to unlock insights for this topic."}</p>
               </div>

               {/* Community Notes Section */}
               <div>
                 <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Community Mnemonics</h3>
                 
                 {/* Add Note Input */}
                 <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      value={newMnemonic}
                      onChange={(e) => setNewMnemonic(e.target.value)}
                      placeholder="Share a mnemonic or high-yield fact..." 
                      className={`flex-1 p-3 rounded-xl border text-sm outline-none focus:border-purple-500 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}
                    />
                    <button 
                      onClick={handleSubmitMnemonic}
                      disabled={!newMnemonic.trim() || isSubmitting}
                      className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
                    </button>
                 </div>

                 {relevantMnemonics.length > 0 ? (
                   <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                     {relevantMnemonics.map(m => (
                       <div key={m.id} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                          <p className="text-sm font-medium mb-2" dangerouslySetInnerHTML={{ __html: m.text }} />
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1 font-bold text-green-600"><ArrowUp className="w-3 h-3"/> {m.votes}</span>
                            <span>• {new Date(m.id).toLocaleDateString()}</span>
                          </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <p className="text-sm text-slate-500 italic p-4 text-center border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-700">No mnemonics yet. Be the first to share!</p>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className={`text-4xl lg:text-6xl font-black mb-3 ${getTextColor('text-slate-900', 'text-white')}`}>Deep Dive Hubs</h2>
          <p className={getTextColor('text-xl text-slate-600', 'text-slate-400')}>Centralized topic resources and performance analysis.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metadataLoading ? <p>Loading Hubs...</p> : allSubjects.map(subject => ( 
            <button 
              key={subject.name} 
              onClick={() => openDeepDiveModal(subject)} 
              className={`rounded-3xl p-8 hover:shadow-2xl transition-all border text-left hover:scale-[1.01] ${CardStyle.bg} ${CardStyle.border}`}
            >
              <div className={`w-20 h-20 bg-gradient-to-br ${subject.color} rounded-3xl flex items-center justify-center text-5xl mb-5 shadow-2xl`}>
                {subject.icon || '📚'}
              </div>
              <h3 className={getTextColor('font-black text-2xl mb-4 text-slate-900', 'text-white')}>{subject.name}</h3>
              <div className="space-y-3 mb-6">
                <div className={getTextColor('flex items-center gap-2 text-sm text-slate-600', 'flex items-center gap-2 text-sm text-slate-400')}>
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>{Object.keys(subject.subtopics || {}).length} Subtopics</span>
                </div>
              </div>
              <div className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                <span>View Hub</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
      {isDeepDiveModalOpen && <DeepDiveModal />}
    </>
  );
};

export default DeepDiveView;