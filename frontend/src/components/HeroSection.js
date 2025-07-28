
import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../translations';
import { Button } from './common/button';

export const HeroSection = () => {
  const { language, setCurrentView } = useAppContext();
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
          <Button 
            onClick={() => document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' })}
            size="lg"
          >
            {t.bookNow}
          </Button>
          <Button 
            onClick={() => setCurrentView('admin')}
            variant="secondary"
            size="lg"
          >
            {t.adminDashboard}
          </Button>
        </div>
      </div>
    </div>
  );
};
