// src/views/LeaderboardView.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Trophy, Medal, Flame, Target, Users, Loader2 } from 'lucide-react';
import UIContext from '../context/UIContext';
import AuthContext from '../context/AuthContext';
import { getLeaderboard } from '../services/firestoreService';

const LeaderboardView = () => {
  const { getTextColor, getCardStyle, isDarkMode } = useContext(UIContext);
  const { user } = useContext(AuthContext);
  const CardStyle = getCardStyle();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('testsCompleted'); // 'testsCompleted' or 'streak'

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await getLeaderboard(filter);
        setLeaderboard(data);
      } catch (error) {
        console.error("Failed to load leaderboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [filter]);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-700 fill-amber-700" />;
    return <span className="font-bold text-slate-500 w-6 text-center">{index + 1}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto h-full overflow-y-auto p-6">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className={`text-4xl font-black flex items-center gap-3 ${getTextColor('text-slate-900', 'text-white')}`}>
            <Trophy className="w-8 h-8 text-purple-500" /> Leaderboards
          </h1>
          <p className={getTextColor('text-slate-600', 'text-slate-400')}>See where you stand among top performers.</p>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button 
            onClick={() => setFilter('testsCompleted')}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${filter === 'testsCompleted' ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}
          >
            <Target className="w-4 h-4" /> Most Tests
          </button>
          <button 
            onClick={() => setFilter('streak')}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${filter === 'streak' ? 'bg-white dark:bg-gray-700 shadow text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}
          >
            <Flame className="w-4 h-4" /> Highest Streak
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className={`${CardStyle.bg} ${CardStyle.border} rounded-3xl border overflow-hidden shadow-xl`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-purple-50 dark:bg-slate-800 border-b dark:border-slate-700">
                <tr>
                  <th className="p-6 font-bold text-sm text-slate-500 uppercase">Rank</th>
                  <th className="p-6 font-bold text-sm text-slate-500 uppercase">User</th>
                  <th className="p-6 font-bold text-sm text-slate-500 uppercase text-center">
                    {filter === 'streak' ? 'Day Streak' : 'Tests Done'}
                  </th>
                  <th className="p-6 font-bold text-sm text-slate-500 uppercase text-right">XP</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((u, index) => {
                  const isMe = user && user.uid === u.id;
                  return (
                    <tr 
                      key={u.id} 
                      className={`border-b dark:border-slate-700 hover:bg-purple-50/50 dark:hover:bg-slate-700/50 transition-colors ${isMe ? 'bg-purple-100/50 dark:bg-purple-900/20' : ''}`}
                    >
                      <td className="p-6 flex items-center gap-4">
                        {getRankIcon(index)}
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold shadow-md">
                            {u.displayName ? u.displayName[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className={`font-bold ${isMe ? 'text-purple-600 dark:text-purple-400' : 'text-slate-700 dark:text-white'}`}>
                              {u.displayName || 'Anonymous'} {isMe && '(You)'}
                            </p>
                            <p className="text-xs text-slate-500">Level {Math.floor((u.testsCompleted || 0) / 5) + 1}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`font-black text-lg ${filter === 'streak' ? 'text-orange-500' : 'text-blue-500'}`}>
                          {filter === 'streak' ? (u.streak || 0) : (u.testsCompleted || 0)}
                        </span>
                      </td>
                      <td className="p-6 text-right font-mono text-slate-600 dark:text-slate-400">
                        {((u.testsCompleted || 0) * 100 + (u.streak || 0) * 50).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {leaderboard.length === 0 && (
            <div className="p-10 text-center text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No data available yet. Be the first to rank!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaderboardView;