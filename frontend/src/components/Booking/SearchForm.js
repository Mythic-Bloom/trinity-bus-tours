
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { translations } from '../../translations';
import { API_BASE } from '../../config/config';
import { Input } from '../common/input';
import { Button } from '../common/button';

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
          <Input
            type="select"
            label={t.fromCity}
            placeholder={t.fromCity}
            value={searchData.origin}
            onChange={(e) => setSearchData({...searchData, origin: e.target.value})}
            options={cities}
            required
          />
          
          <Input
            type="select"
            label={t.toCity}
            placeholder={t.toCity}
            value={searchData.destination}
            onChange={(e) => setSearchData({...searchData, destination: e.target.value})}
            options={cities}
            required
          />
          
          <Input
            type="date"
            label={t.travelDate}
            value={searchData.travelDate}
            onChange={(e) => setSearchData({...searchData, travelDate: e.target.value})}
            min={new Date().toISOString().split('T')[0]}
            required
          />
          
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              {t.searchBuses}
            </Button>
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
          <Button variant="success" onClick={handleTrackJourney}>
            {t.trackJourney}
          </Button>
        </div>
      </div>
    </div>
  );
};
