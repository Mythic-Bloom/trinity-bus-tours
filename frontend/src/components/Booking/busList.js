
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { translations } from '../../translations';
import { Button } from '../common/button';

export const BusList = ({ buses, onSelectBus, currency = 'USD' }) => {
  const { language } = useAppContext();
  const t = translations[language];

  if (!buses.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No buses available for this route and date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {buses.map((bus) => (
        <div key={bus.bus_id} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {bus.bus_type === 'premium' ? t.premium : t.economy} Bus
              </h3>
              <p className="text-gray-600">
                Departure: {bus.departure_time} → Arrival: {bus.arrival_time}
              </p>
              <p className="text-sm text-gray-500">Bus: {bus.bus_number} | Driver: {bus.driver_name}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                {bus.price.toLocaleString()} KES
              </p>
              <p className="text-sm text-gray-600">
                {bus.available_seats.length} seats available
              </p>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {bus.total_seats} seats
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                WiFi & AC
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                bus.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {bus.status}
              </span>
            </div>
            <Button onClick={() => onSelectBus(bus)}>
              {t.selectSeats}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
