
import React from 'react';
import { useAppContext } from '../contexts/AppContext';

export const LanguageSelector = () => {
  const { language, setLanguage } = useAppContext();

  return (
    <div className="fixed top-4 right-4 z-50">
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium shadow-lg"
      >
        <option value="en">🇬🇧 English</option>
        <option value="sw">🇰🇪 Kiswahili</option>
        <option value="fr">🇷🇼 Français</option>
      </select>
    </div>
  );
};
