// src/components/Sidebar.jsx
import React, { useContext, useState } from 'react';
import { 
  BookOpen, Target, Clock, Trophy, FileText, Home, User, Menu, Star, ChevronRight, Play, 
  CheckCircle, TrendingUp, Award, Calendar, Brain, Flame, AlertCircle, TrendingDown, 
  ArrowUp, ArrowDown, BarChart3, Filter, Shuffle, Search, MessageSquare, Video, 
  Share2, Users, Lightbulb, Library, Sun, Moon, X, Minus, Hash, Bookmark, Zap, 
  Dribbble, Compass, CheckSquare, Maximize2, Layers, Plus, TrendingDownIcon, 
  UserCheck, Microscope, LogOut, Bell, Edit2, Check
} from 'lucide-react';
import AuthContext from '../context/AuthContext';
import UIContext from '../context/UIContext';

const Sidebar = () => {
  const { user, handleLogout, updateUserName, authLoading } = useContext(AuthContext);
  const { currentView, setCurrentView, setIsMobileMenuOpen } = useContext(UIContext);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.displayName || '');

  const handleNavigation = (view) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const handleSaveName = async () => {
    if (tempName.trim() !== user.displayName) {
       await updateUserName(tempName);
    }
    setIsEditingName(false);
  };

  return (
    <div className="w-72 bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 h-screen flex flex-col shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-10 -mr-32 -mt-32"></div>
            
      <div className="relative z-10 p-6 border-b border-purple-800/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-400 via-pink-400 to-rose-400 rounded-2xl shadow-2xl">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black">
              <span className="bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">MedVanshi</span>
            </h1>
            <p className="text-xs text-purple-300 font-semibold">NEET PG Excellence</p>
          </div>
        </div>
      </div>
            
      <nav className="relative z-10 flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {[
          { view: 'home', icon: Home, label: 'Home' },
          { view: 'study-planner', icon: Calendar, label: 'AI Study Planner' },
          { view: 'qbank', icon: BookOpen, label: 'Custom Test' },
          { view: 'subject-test', icon: Target, label: 'Subject Tests' },
          { view: 'conquer-mode', icon: Zap, label: 'Conquer Mode' },
          { view: 'grand-tests', icon: Trophy, label: 'Grand Tests' },
          { view: 'analytics', icon: BarChart3, label: 'Analytics' },
          { view: 'leaderboard', icon: Users, label: 'Leaderboard' },
          { view: 'deep-dive', icon: Microscope, label: 'Deep Dive Hubs' }, 
          { view: 'flashcards', icon: Lightbulb, label: 'Flashcards' },
          { view: 'patient-encounters', icon: UserCheck, label: 'Patient Encounters' }, 
          { view: 'offline-mode', icon: Video, label: 'Offline Mode' }, 
          { view: 'mistakes', icon: Star, label: 'Mistake Notebook' },
          { view: 'ai-chat', icon: Brain, label: 'AI Assistant' } 
        ].map((item) => (
          <button
            key={item.view}
            onClick={() => handleNavigation(item.view)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
              currentView === item.view
                ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-xl scale-[1.02]'
                : 'text-purple-200 hover:bg-purple-800/50 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
            
      <div className="relative z-10 p-4 border-t border-purple-800/50">
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-4 border border-slate-600/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                 <div className="flex items-center gap-1">
                    <input 
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full bg-slate-900 text-white text-xs p-1 rounded border border-purple-500 focus:outline-none"
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4"/></button>
                 </div>
              ) : (
                 <div className="flex items-center justify-between group">
                    <p className="text-sm font-bold text-white truncate" title={user.displayName || 'Guest'}>
                      {user.displayName || 'Guest'}
                    </p>
                    <button onClick={() => { setTempName(user.displayName); setIsEditingName(true); }} className="opacity-0 group-hover:opacity-100 text-purple-400 hover:text-white transition-opacity">
                       <Edit2 className="w-3 h-3" />
                    </button>
                 </div>
              )}
              <div className="flex items-center gap-1 text-xs text-purple-300 mt-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="font-semibold">{user.streak || 0} day streak</span>
              </div>
            </div>
            <button
                onClick={handleLogout}
                title="Logout"
                disabled={authLoading}
                className="p-2 ml-2 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;