
import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [currentView, setCurrentView] = useState('booking');
  const [currentStep, setCurrentStep] = useState('search');

  const contextValue = {
    language,
    setLanguage,
    currentStep,
    setCurrentStep,
    currentView,
    setCurrentView
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
