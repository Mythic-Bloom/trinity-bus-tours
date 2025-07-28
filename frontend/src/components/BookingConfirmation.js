
import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../translations';
import { Button } from './common/button';

export const BookingConfirmation = ({ booking, onNewBooking, onTrackJourney }) => {
  const { language } = useAppContext();
  const t = translations[language];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="mb-8">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-3xl font-bold text-green-600 mb-4">{t.bookingConfirmed}</h3>
        <p className="text-gray-600">Booking ID: {booking.booking_id}</p>
      </div>

      {/* QR Code */}
      {booking.qr_code && (
        <div className="mb-8">
          <img src={booking.qr_code} alt="QR Code" className="mx-auto max-w-48" />
          <p className="text-sm text-gray-600 mt-2">Show this QR code when boarding</p>
        </div>
      )}

      {/* Booking Details */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
        <h4 className="font-semibold mb-4">{t.bookingDetails}</h4>
        <div className="space-y-2 text-sm">
          <p><strong>Seats:</strong> {booking.seat_numbers.join(', ')}</p>
          <p><strong>Travel Date:</strong> {booking.travel_date}</p>
          <p><strong>Total Price:</strong> {booking.total_price.toLocaleString()} {booking.currency}</p>
          <p><strong>Status:</strong> {booking.status}</p>
        </div>
      </div>

      <div className="space-y-4">
        <Button
          onClick={() => onTrackJourney(booking.booking_id)}
          variant="success"
          className="w-full"
        >
          {t.trackJourney}
        </Button>
        <Button className="w-full">
          {t.downloadTicket}
        </Button>
        <Button
          onClick={onNewBooking}
          variant="secondary"
          className="w-full"
        >
          {t.newBooking}
        </Button>
      </div>
    </div>
  );
};
