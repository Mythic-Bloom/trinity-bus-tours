
import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { translations } from '../../translations';

export const PassengerForm = ({ selectedSeats, bus, onSubmit, onBack }) => {
  const { language } = useAppContext();
  const t = translations[language];
  const [passengerData, setPassengerData] = useState({
    passengers: selectedSeats.map(() => ({ name: '' })),
    user: {
      fullName: '',
      email: '',
      phone: ''
    },
    paymentMethod: 'm-pesa'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(passengerData);
  };

  const updatePassenger = (index, name) => {
    const newPassengers = [...passengerData.passengers];
    newPassengers[index].name = name;
    setPassengerData({...passengerData, passengers: newPassengers});
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h3 className="text-2xl font-bold mb-6">{t.passengerInfo}</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Information */}
        <div className="border-b pb-6">
          <h4 className="text-lg font-semibold mb-4">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={t.fullName}
              value={passengerData.user.fullName}
              onChange={(e) => setPassengerData({
                ...passengerData, 
                user: {...passengerData.user, fullName: e.target.value}
              })}
              className="p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="email"
              placeholder={t.email}
              value={passengerData.user.email}
              onChange={(e) => setPassengerData({
                ...passengerData,
                user: {...passengerData.user, email: e.target.value}
              })}
              className="p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <input
            type="tel"
            placeholder={t.phone}
            value={passengerData.user.phone}
            onChange={(e) => setPassengerData({
              ...passengerData,
              user: {...passengerData.user, phone: e.target.value}
            })}
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 mt-4"
            required
          />
        </div>

        {/* Passenger Names */}
        <div className="border-b pb-6">
          <h4 className="text-lg font-semibold mb-4">{t.passengers}</h4>
          {selectedSeats.map((seat, index) => (
            <div key={seat} className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Seat {seat} - Passenger Name
              </label>
              <input
                type="text"
                placeholder={`Passenger ${index + 1} name`}
                value={passengerData.passengers[index].name}
                onChange={(e) => updatePassenger(index, e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          ))}
        </div>

        {/* Payment Method */}
        <div>
          <h4 className="text-lg font-semibold mb-4">{t.paymentMethod}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['m-pesa', 'airtel-money', 'mtn-money', 'card'].map((method) => (
              <label key={method} className="cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={passengerData.paymentMethod === method}
                  onChange={(e) => setPassengerData({...passengerData, paymentMethod: e.target.value})}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-xl text-center transition-all ${
                  passengerData.paymentMethod === method 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}>
                  <div className="font-semibold text-sm">
                    {method.replace('-', ' ').toUpperCase()}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="bg-blue-50 p-6 rounded-xl">
          <div className="flex justify-between text-lg font-semibold">
            <span>{t.totalPrice}:</span>
            <span>{(selectedSeats.length * bus.price).toLocaleString()} KES</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300"
          >
            {t.backToSeats}
          </button>
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300"
          >
            {t.confirmBooking}
          </button>
        </div>
      </form>
    </div>
  );
};
