
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { translations } from '../../translations';
import { API_BASE } from '../../config/config';

export const SearchForm = ({ onSearch }) => {
  const { language } = useAppContext();
  const t = translations[language];
  const [searchData, setSearchData] = useState({
    origin: '',
    destination: '',
    travelDate: ''
  });
  const [countries, setCountries] = useState({});
  const [trackingId, setTrackingId] = useState('');

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/countries`);
      const data = await response.json();
      setCountries(data.countries);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchData.origin && searchData.destination && searchData.travelDate) {
      onSearch(searchData);
    }
  };

  const handleTrackJourney = () => {
    if (trackingId.trim()) {
      onSearch({ type: 'track', bookingId: trackingId.trim() });
    }
  };

  const cities = Object.values(countries).flat();

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.fromCity}</label>
            <select
              value={searchData.origin}
              onChange={(e) => setSearchData({...searchData, origin: e.target.value})}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">{t.fromCity}</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.toCity}</label>
            <select
              value={searchData.destination}
              onChange={(e) => setSearchData({...searchData, destination: e.target.value})}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">{t.toCity}</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.travelDate}</label>
            <input
              type="date"
              value={searchData.travelDate}
              onChange={(e) => setSearchData({...searchData, travelDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              {t.searchBuses}
            </button>
          </div>
        </form>
      </div>

      {/* Journey Tracking */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
        <h3 className="text-xl font-bold mb-4 text-center">Track Your Journey</h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter your booking ID"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleTrackJourney}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300"
          >
            {t.trackJourney}
          </button>
        </div>
      </div>
    </div>
  );
};
