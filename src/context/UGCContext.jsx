// src/context/UGCContext.jsx
import React, { useState, createContext, useEffect } from 'react';
import { getCommunityMnemonics, submitPublicMnemonic } from '../services/firestoreService';

const UGCContext = createContext();

export const UGCProvider = ({ children }) => {
  const [communityMnemonics, setCommunityMnemonics] = useState([]);

  useEffect(() => {
    const fetchMnemonics = async () => {
      try {
        const data = await getCommunityMnemonics();
        setCommunityMnemonics(data);
      } catch (error) {
        console.error("Failed to fetch mnemonics", error);
      }
    };
    fetchMnemonics();
  }, []);

  const submitMnemonic = async (text, subject) => {
    // Optimistic Update
    const newMnemonic = { id: Date.now(), text, subject, votes: 0, keywords: text.toLowerCase() };
    setCommunityMnemonics(prev => [newMnemonic, ...prev]);
    
    try {
      await submitPublicMnemonic({ text, subject, keywords: text.toLowerCase() });
    } catch (error) {
      console.error("Failed to save mnemonic", error);
      // Revert optimistic update if needed (skipped for simplicity)
    }
  };

  return (
    <UGCContext.Provider value={{ communityMnemonics, submitMnemonic }}>
      {children}
    </UGCContext.Provider>
  );
};

export default UGCContext;