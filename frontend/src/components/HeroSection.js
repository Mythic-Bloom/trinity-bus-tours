
import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../translations';

export const HeroSection = () => {
  const { language, handleNavigateToAdmin } = useAppContext();
  const t = translations[language];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1615514659684-cece95b952f4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxidXMlMjB0cmF2ZWx8ZW58MHx8fGJsdWV8MTc1MzYyODI2Nnww&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          {t.title}
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-blue-100">
          {t.subtitle}
        </h2>
        <p className="text-lg md:text-xl mb-12 text-gray-200 leading-relaxed">
          {t.heroDescription}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            {t.bookNow}
          </button>
          <button 
            onClick={() => handleNavigateToAdmin()}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            {t.adminDashboard}
          </button>
        </div>
      </div>
    </div>
  );
};
