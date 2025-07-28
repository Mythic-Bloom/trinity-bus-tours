
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../translations';
import { API_BASE } from '../config/config';
import { MapView } from './MapView';

export const JourneyTracking = ({ bookingId, onBack }) => {
  const { language } = useAppContext();
  const t = translations[language];
  const [trackingData, setTrackingData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrackingData();
    getUserLocation();
    
    // Update tracking every 30 seconds
    const interval = setInterval(fetchTrackingData, 30000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchTrackingData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/track`);
      const data = await response.json();
      setTrackingData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Error getting user location:', error);
        }
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-500';
      case 'in_transit': return 'bg-blue-500';
      case 'arrived': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Unable to load tracking information.</p>
        <button
          onClick={onBack}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">{t.trackingInfo}</h2>
        <button
          onClick={onBack}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
        >
          Back
        </button>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">
            {trackingData.route.origin} → {trackingData.route.destination}
          </h3>
          <div className={`px-4 py-2 rounded-full text-white font-semibold ${getStatusColor(trackingData.status)}`}>
            {trackingData.status.toUpperCase()}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">{t.busStatus}</p>
            <p className="font-semibold">{trackingData.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t.estimatedArrival}</p>
            <p className="font-semibold">{new Date(trackingData.eta).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Progress</p>
            <p className="font-semibold">{trackingData.progress_percentage.toFixed(1)}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${trackingData.progress_percentage}%` }}
          ></div>
        </div>

        {/* Map */}
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2">{t.currentLocation}</h4>
          <MapView
            route={trackingData.route}
            currentLocation={trackingData.current_location}
            userLocation={userLocation}
            showRoute={true}
          />
        </div>
      </div>
    </div>
  );
};
