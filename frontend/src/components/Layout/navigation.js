import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { translations } from '../../translations';

export const Navigation = () => {
  const { language, setCurrentView, currentView } = useAppContext();
  const t = translations[language];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-blue-600">{t.title}</h1>
            <div className="hidden md:flex space-x-4">
              <button
                onClick={() => setCurrentView('booking')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  currentView === 'booking' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                {t.bookNow}
              </button>
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  currentView === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                {t.adminDashboard}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};