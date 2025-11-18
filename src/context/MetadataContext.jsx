// src/context/MetadataContext.jsx
import React, { useState, useEffect, createContext, useCallback } from 'react';
import { getSubjects } from '../services/firestoreService';
import { Q_BANK_SOURCES } from '../constants/data'; 

// HMR FIX: The "export { MetadataContext };" line has been removed.
const MetadataContext = createContext({
  allSubjects: [],
  metadataLoading: true,
  selectedSources: Q_BANK_SOURCES, 
  toggleSource: () => {} 
});

export const MetadataProvider = ({ children }) => {
  const [allSubjects, setAllSubjects] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  
  const [selectedSources, setSelectedSources] = useState(Q_BANK_SOURCES); 

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setMetadataLoading(true);
        const subjects = await getSubjects(selectedSources);
        setAllSubjects(subjects);
      } catch (error) {
        console.error("Failed to load metadata:", error);
      } finally {
        setMetadataLoading(false);
      }
    };
    
    loadMetadata();
  }, [selectedSources]); 

  const toggleSource = useCallback((source) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source) 
        : [...prev, source]
    );
  }, []);

  return (
    <MetadataContext.Provider value={{ 
      allSubjects, 
      metadataLoading,
      selectedSources, 
      toggleSource     
    }}>
      {children}
    </MetadataContext.Provider>
  );
};

export default MetadataContext;