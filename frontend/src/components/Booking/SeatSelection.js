
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { translations } from '../../translations';

export const SeatSelection = ({ bus, onSeatSelect, selectedSeats }) => {
  const { language } = useAppContext();
  const t = translations[language];

  const getSeatStatus = (seatNumber) => {
    if (!bus.available_seats.includes(seatNumber)) return 'booked';
    if (selectedSeats.includes(seatNumber)) return 'selected';
    return 'available';
  };

  const getSeatColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-200 hover:bg-green-300 text-green-800';
      case 'selected': return 'bg-blue-500 text-white';
      case 'booked': return 'bg-gray-400 text-gray-600 cursor-not-allowed';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h3 className="text-2xl font-bold mb-6 text-center">{t.selectSeats}</h3>
      
      {/* Legend */}
      <div className="flex justify-center space-x-6 mb-8">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-green-200 rounded"></div>
          <span className="text-sm">{t.available}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-500 rounded"></div>
          <span className="text-sm">{t.selected}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-400 rounded"></div>
          <span className="text-sm">{t.booked}</span>
        </div>
      </div>

      {/* Bus Layout */}
      <div className="max-w-md mx-auto">
        <div className="bg-gray-100 rounded-t-3xl p-4 mb-2">
          <div className="text-center text-sm font-semibold">Driver</div>
        </div>
        
        <div className="border-2 border-gray-300 rounded-lg p-4 space-y-3">
          {bus.seat_layout.layout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center space-x-2">
              {row.map((seat, seatIndex) => (
                seat === "" ? (
                  <div key={seatIndex} className="w-12 h-12"></div>
                ) : (
                  <button
                    key={seat}
                    onClick={() => getSeatStatus(seat) === 'available' && onSeatSelect(seat)}
                    className={`w-12 h-12 rounded-lg font-bold text-sm transition-all duration-200 ${getSeatColor(getSeatStatus(seat))}`}
                    disabled={getSeatStatus(seat) === 'booked'}
                  >
                    {seat}
                  </button>
                )
              ))}
            </div>
          ))}
        </div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="mt-8 p-6 bg-blue-50 rounded-xl">
          <p className="text-lg font-semibold">
            {t.passengers}: {selectedSeats.length} | 
            {t.totalPrice}: {(selectedSeats.length * bus.price).toLocaleString()} KES
          </p>
        </div>
      )}
    </div>
  );
};
