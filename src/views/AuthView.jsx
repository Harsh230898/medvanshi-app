// src/views/AuthView.jsx
import React, { useState, useContext } from 'react';
import { Brain, Clock, AlertCircle } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import UIContext from '../context/UIContext';

const AuthView = () => {
  const { handleLogin, handleSignUp, authLoading, authError } = useContext(AuthContext);
  const { getBackgroundColor, getTextColor, getCardStyle, isDarkMode } = useContext(UIContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);

  const submitAuth = (e) => {
    e.preventDefault();
    if (isLoginMode) {
      handleLogin(email, password);
    } else {
      handleSignUp(email, password);
    }
  };
  
  const authCardStyle = getCardStyle();

  // Added w-full to outer div to ensure centering works correctly on all screen sizes
  return (
    <div className={`flex items-center justify-center min-h-screen w-full p-4 ${getBackgroundColor('bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50', 'bg-slate-900')}`}>
      
      <div className={`w-full max-w-md p-8 md:p-10 rounded-3xl shadow-2xl ${authCardStyle.bg} ${authCardStyle.border} border backdrop-blur-xl`}>
        
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="p-4 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl shadow-xl mx-auto w-16 h-16 mb-4 flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
        
          <h2 className="text-4xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">MedVanshi</span>
          </h2>
          <p className={`mt-2 font-medium ${getTextColor('text-slate-600', 'text-slate-400')}`}>
            Log in to access your personalized dashboard
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={submitAuth} className="space-y-4">
          <input
            id="auth-email"
            name="email"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`w-full p-4 rounded-xl border-2 outline-none focus:border-purple-500 transition-all shadow-sm font-medium ${isDarkMode ?
 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 focus:bg-white'}`}
          />
          <input
            id="auth-password"
            name="password"
            type="password"
            placeholder="Password (Min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={`w-full p-4 rounded-xl border-2 outline-none focus:border-purple-500 transition-all shadow-sm font-medium ${isDarkMode ?
 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 focus:bg-white'}`}
          />
          
          {authError && (
            <div className="p-3 text-sm font-bold rounded-xl bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading || password.length < (isLoginMode ? 1 : 6)}
            className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 ${authLoading || password.length < (isLoginMode ? 1 : 6) ? 
                'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500' :
                'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
            }`}
          >
            {authLoading ? (
              <>
                <Clock className="w-5 h-5 animate-spin" /> {isLoginMode ? 'Logging In...' : 'Signing Up...'}
              </>
            ) : (
              isLoginMode ? 'Log In' : 'Sign Up'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t pt-6 border-slate-200 dark:border-slate-700">
          <button
            onClick={() => { 
              setIsLoginMode(!isLoginMode); 
              setAuthError('');
            }}
            className="text-sm font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
          >
            {isLoginMode ? "Don't have an account? Create Account" : "Already have an account? Log In"}
          </button>
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 font-mono">
            Mock Credentials: `dr.devanshi@medvanshi.com`, `password123`
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;