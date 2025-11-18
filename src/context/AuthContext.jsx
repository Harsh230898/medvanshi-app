// src/context/AuthContext.jsx
import React, { useState, useContext, createContext, useEffect } from 'react';
import UIContext from './UIContext';
import NotificationContext from './NotificationContext';
import { apiLogin, apiSignUp, apiLogout, getUserData, updateStreak, updateUserProfile } from '../services/firestoreService'; // Added updateUserProfile
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const uiContext = useContext(UIContext);
  const notificationContext = useContext(NotificationContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState({ displayName: 'Guest', streak: 0 });

  // Persistent Login Logic
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await getUserData(firebaseUser.uid);
          if (userData) {
            const currentStreak = await updateStreak(firebaseUser.uid);
            setUser({ ...firebaseUser, ...userData, streak: currentStreak || userData.streak || 1 });
            setIsAuthenticated(true);
          } else {
            await apiLogout(); 
          }
        } catch (error) {
          console.error("Failed to fetch persistent user data:", error);
          await apiLogout(); 
        }
      } else {
        setUser({ displayName: 'Guest', streak: 0 });
        setIsAuthenticated(false);
      }
      
      if (uiContext) {
          uiContext.setIsAppLoading(false);
      }
    });

    return () => unsubscribe();
  }, [uiContext]);

  const handleLogin = async (email, password) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await apiLogin(email, password);
      
      const userData = await getUserData(userCredential.user.uid);

      if (userData) {
        const currentStreak = await updateStreak(userCredential.user.uid);
        setUser({ ...userCredential.user, ...userData, streak: currentStreak || 1 });
        setIsAuthenticated(true);
        notificationContext?.addNotification(`Welcome back, ${userData.displayName}!`, 'success');
      } else {
        throw new Error("User data not found.");
      }
      return true;
    } catch (error) {
      const errorMsg = error.message || 'Login failed. Please check your credentials.';
      setAuthError(errorMsg);
      notificationContext?.addNotification(errorMsg, 'error');
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (email, password) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await apiSignUp(email, password);
      const userData = await getUserData(userCredential.user.uid);
      setUser({ ...userCredential.user, ...userData, streak: 1 });
      setIsAuthenticated(true);
      notificationContext?.addNotification(`Welcome, ${userData.displayName}! Your account is ready.`, 'success');
      return true;
    } catch (error) {
      const errorMsg = error.message || 'Sign up failed. Please try again.';
      setAuthError(errorMsg);
      notificationContext?.addNotification(errorMsg, 'error');
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    try {
      await apiLogout();
      notificationContext?.addNotification("You have been logged out.", 'info');
    } catch (error) {
      notificationContext?.addNotification("Logout failed. Please try again.", 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // NEW: Update User Name
  const updateUserName = async (newName) => {
    if (!user || !newName.trim()) return;
    try {
      await updateUserProfile(user.uid, { displayName: newName });
      setUser(prev => ({ ...prev, displayName: newName }));
      notificationContext?.addNotification("Name updated successfully!", "success");
      return true;
    } catch (error) {
      console.error("Update failed:", error);
      notificationContext?.addNotification("Failed to update name.", "error");
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, user, authLoading, authError, 
      handleLogin, handleSignUp, handleLogout, updateUserName // Exported
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;