'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ThreeDContextType {
  is3DMode: boolean;
  toggle3DMode: () => void;
  currentSection: string;
  setCurrentSection: (section: string) => void;
}

const ThreeDContext = createContext<ThreeDContextType | undefined>(undefined);

export const useThreeD = () => {
  const context = useContext(ThreeDContext);
  if (context === undefined) {
    throw new Error('useThreeD must be used within a ThreeDProvider');
  }
  return context;
};

interface ThreeDProviderProps {
  children: ReactNode;
}

export const ThreeDProvider: React.FC<ThreeDProviderProps> = ({ children }) => {
  const [is3DMode, setIs3DMode] = useState(false);
  const [currentSection, setCurrentSection] = useState('about');

  const toggle3DMode = () => {
    setIs3DMode(prev => !prev);
  };

  const value = {
    is3DMode,
    toggle3DMode,
    currentSection,
    setCurrentSection,
  };

  return (
    <ThreeDContext.Provider value={value}>
      {children}
    </ThreeDContext.Provider>
  );
};
