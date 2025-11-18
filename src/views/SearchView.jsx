// src/views/SearchView.jsx
import React, { useContext } from 'react';
import { FileText, Brain, Lightbulb, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import UIContext from '../context/UIContext';

const SearchView = ({ results, query, loading }) => {
  const { getTextColor, getCardStyle } = useContext(UIContext);
  const CardStyle = getCardStyle();
  
  const totalResults = results.qbank.length + results.topics.length + results.flashcards.length + results.mnemonics.length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <h2 className={`text-4xl lg:text-6xl font-black ${getTextColor('text-slate-900', 'text-white')}`}>
        Search Results for: <span className="text-purple-600 dark:text-purple-400">"{query}"</span>
      </h2>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-xl font-bold text-slate-500">AI is analyzing your query...</p>
            <p className="text-sm text-slate-400">Scanning Question Bank, Flashcards, and Topics.</p>
        </div>
      ) : (
        <>
          <p className={getTextColor('text-xl text-slate-600', 'text-slate-400')}>
            {totalResults} results found across your ecosystem.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters / Summary Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className={getTextColor('text-2xl font-black mb-3', 'text-white')}>Filter By Type</h3>
              {[
                { label: 'QBank Questions', count: results.qbank.length, icon: FileText, color: 'text-green-500' },
                { label: 'Deep Dive Topics', count: results.topics.length, icon: Brain, color: 'text-purple-500' },
                { label: 'Flashcard Decks', count: results.flashcards.length, icon: Lightbulb, color: 'text-orange-500' },
                { label: 'Community Notes', count: results.mnemonics.length, icon: MessageSquare, color: 'text-rose-500' },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-xl flex justify-between items-center ${CardStyle.bg} ${CardStyle.border}`}>
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className={getTextColor('font-semibold', 'text-slate-300')}>{item.label}</span>
                  </div>
                  <span className="font-black text-xl text-purple-600 dark:text-purple-400">{item.count}</span>
                </div>
              ))}
            </div>

            {/* Results Grid */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* 1. Questions */}
              {results.qbank.length > 0 && (
                <div className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-3xl border`}>
                  <h3 className="text-2xl font-black mb-4 border-b pb-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                    <FileText className='w-6 h-6'/> QBank Questions ({results.qbank.length})
                  </h3>
                  <div className="space-y-3">
                    {results.qbank.slice(0, 5).map(q => (
                      <div key={q.id} className="p-4 border-l-4 border-l-green-400 bg-green-50/50 dark:bg-slate-700/50 rounded-lg hover:shadow-md transition-all cursor-pointer">
                        <p className="font-semibold text-sm mb-1">{q.title}</p>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                            {q.source} • {q.subject}
                        </p>
                      </div>
                    ))}
                  </div>
                  {results.qbank.length > 5 && (
                    <button className="mt-4 text-purple-600 dark:text-purple-400 font-bold text-sm hover:underline">
                        View All {results.qbank.length} Questions
                    </button>
                  )}
                </div>
              )}

              {/* 2. Topics */}
              {results.topics.length > 0 && (
                <div className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-3xl border`}>
                  <h3 className="text-2xl font-black mb-4 border-b pb-2 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <Brain className='w-6 h-6'/> Deep Dive Topics ({results.topics.length})
                  </h3>
                  <div className="space-y-3">
                    {results.topics.map(t => (
                      <div key={t.id} className="p-4 border-l-4 border-l-purple-400 bg-purple-50/50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{t.icon}</span>
                            <div>
                                <p className="font-black text-sm">{t.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t.snippet}</p>
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Flashcards */}
              {results.flashcards.length > 0 && (
                <div className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-3xl border`}>
                  <h3 className="text-2xl font-black mb-4 border-b pb-2 flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <Lightbulb className='w-6 h-6'/> Flashcard Decks ({results.flashcards.length})
                  </h3>
                  <div className="space-y-3">
                    {results.flashcards.map(f => (
                      <div key={f.id} className="p-4 border-l-4 border-l-orange-400 bg-orange-50/50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center">
                        <p className="font-semibold text-sm">{f.title}</p>
                        <span className="text-xs font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded-md border">{f.count} cards</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Mnemonics */}
              {results.mnemonics.length > 0 && (
                <div className={`${CardStyle.bg} ${CardStyle.border} p-6 rounded-3xl border`}>
                  <h3 className="text-2xl font-black mb-4 border-b pb-2 flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <MessageSquare className='w-6 h-6'/> Community Notes ({results.mnemonics.length})
                  </h3>
                  <div className="space-y-3">
                    {results.mnemonics.slice(0, 3).map(m => (
                      <div key={m.id} className="p-4 border-l-4 border-l-rose-400 bg-rose-50/50 dark:bg-slate-700/50 rounded-lg">
                        <p className="font-semibold text-sm" dangerouslySetInnerHTML={{ __html: m.title.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }}></p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Subject: {m.subject} | Votes: {m.votes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {totalResults === 0 && (
                <div className={`${CardStyle.bg} ${CardStyle.border} p-20 rounded-3xl text-center border-2 border-dashed border-slate-300 dark:border-slate-700`}>
                  <AlertCircle className='w-12 h-12 mx-auto text-slate-400 mb-4'/>
                  <h3 className='text-2xl font-black text-slate-500'>No Results Found</h3>
                  <p className='text-lg text-slate-400'>Try a different keyword or broaden your search.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SearchView;