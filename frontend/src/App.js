import React, { useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import { HeroSection } from './components/HeroSection';
import { SearchForm } from './components/Booking/searchForm';
import { BusList } from './components/Booking/busList';
import { SeatSelection } from './components/SeatSelection';
import { PassengerForm } from './components/PassengerForm';
import { BookingConfirmation } from './components/BookingConfirmation';
import { JourneyTracking } from './components/JourneyTracking';
import { AdminDashboard } from './components/Admin/dashboard';
import { Navigation } from './components/Layout/navigation';
import { LanguageSelector } from './components/LanguageSelector';
import { MapView } from './components/mapview';
import { Button } from './components/common/button';
import { translations } from './translations/translation';
import { API_BASE } from './config/config';
import './App.css';

const App = () => {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [trackingBookingId, setTrackingBookingId] = useState(null);
  const [searchResults, setSearchResults] = useState({});
  const [language, setLanguage] = useState('en');
  const [currentView, setCurrentView] = useState('booking');
  const [currentStep, setCurrentStep] = useState('search');

  const t = translations[language];

  // Search for buses or track journey
  const handleSearch = async (searchData) => {
    if (searchData.type === 'track') {
      setTrackingBookingId(searchData.bookingId);
      setCurrentStep('tracking');
      return;
    }

    try {
      const routeResponse = await fetch(`${API_BASE}/api/routes/search?origin=${searchData.origin}&destination=${searchData.destination}`);
      const routeData = await routeResponse.json();

      if (routeData.routes.length > 0) {
        const route = routeData.routes[0];
        const busResponse = await fetch(`${API_BASE}/api/buses/${route.route_id}?date=${searchData.travelDate}`);
        const busData = await busResponse.json();

        setBuses(busData.buses);
        setSearchResults({ ...searchData, route });
        setCurrentStep('buses');
      } else {
        alert('No routes found for this combination');
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Select bus and show seat selection
  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
    setSelectedSeats([]);
    setCurrentStep('seats');
  };

  // Toggle seat selection
  const handleSeatSelect = (seatNumber) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  // Proceed to passenger form
  const handleProceedToPassenger = () => {
    if (selectedSeats.length > 0) {
      setCurrentStep('passenger');
    }
  };

  // Create booking
  const handleCreateBooking = async (passengerData) => {
    try {
      // Create or get user
      const userResponse = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: passengerData.user.email,
          full_name: passengerData.user.fullName,
          phone: passengerData.user.phone,
          preferred_language: language
        })
      });
      const userData = await userResponse.json();

      // Create booking
      const bookingData = {
        user_id: userData.user.user_id,
        bus_id: selectedBus.bus_id,
        route_id: selectedBus.route_id,
        seat_numbers: selectedSeats,
        passenger_names: passengerData.passengers.map(p => p.name),
        total_price: selectedSeats.length * selectedBus.price,
        currency: 'KES',
        travel_date: searchResults.travelDate
      };

      const bookingResponse = await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      const bookingResult = await bookingResponse.json();

      // Process mock payment
      await fetch(`${API_BASE}/api/payment/mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingResult.booking.booking_id,
          payment_method: passengerData.paymentMethod,
          amount: bookingResult.booking.total_price
        })
      });

      setCurrentBooking(bookingResult.booking);
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Booking error:', error);
    }
  };

  // Start new booking
  const handleNewBooking = () => {
    setCurrentStep('search');
    setCurrentView('booking');
    setSelectedSeats([]);
    setSelectedBus(null);
    setBuses([]);
    setCurrentBooking(null);
    setTrackingBookingId(null);
  };

  // Track journey
  const handleTrackJourney = (bookingId) => {
    setTrackingBookingId(bookingId);
    setCurrentStep('tracking');
  };

  const contextValue = {
    language,
    setLanguage,
    currentStep,
    setCurrentStep,
    currentView,
    setCurrentView
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <LanguageSelector />
        <Navigation />

        {currentView === 'admin' ? (
          <AdminDashboard />
        ) : currentView === 'booking' ? (
          <>
            {currentStep === 'search' && (
              <>
                <HeroSection />
                <div id="booking-section" className="py-16 px-4">
                  <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
                      Book Your Journey or Track Existing Booking
                    </h2>
                    <SearchForm onSearch={handleSearch} />
                  </div>
                </div>
              </>
            )}

            {currentStep === 'buses' && (
              <div className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Available Buses</h2>
                    <Button
                      onClick={() => setCurrentStep('search')}
                      variant="secondary"
                    >
                      {t.backToSearch}
                    </Button>
                  </div>
                  <BusList buses={buses} onSelectBus={handleSelectBus} />
                </div>
              </div>
            )}

            {currentStep === 'seats' && selectedBus && (
              <div className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Select Your Seats</h2>
                    <Button
                      onClick={() => setCurrentStep('buses')}
                      variant="secondary"
                    >
                      Back to Buses
                    </Button>
                  </div>
                  <SeatSelection 
                    bus={selectedBus} 
                    onSeatSelect={handleSeatSelect}
                    selectedSeats={selectedSeats}
                  />
                  {selectedSeats.length > 0 && (
                    <div className="text-center mt-8">
                      <Button onClick={handleProceedToPassenger}>
                        {t.proceedToPayment}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 'passenger' && selectedBus && (
              <div className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                  <PassengerForm
                    selectedSeats={selectedSeats}
                    bus={selectedBus}
                    onSubmit={handleCreateBooking}
                    onBack={() => setCurrentStep('seats')}
                  />
                </div>
              </div>
            )}

            {currentStep === 'confirmation' && currentBooking && (
              <div className="py-20 px-4">
                <div className="max-w-2xl mx-auto">
                  <BookingConfirmation
                    booking={currentBooking}
                    onNewBooking={handleNewBooking}
                    onTrackJourney={handleTrackJourney}
                  />
                </div>
              </div>
            )}

            {currentStep === 'tracking' && trackingBookingId && (
              <div className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                  <JourneyTracking
                    bookingId={trackingBookingId}
                    onBack={() => setCurrentStep('search')}
                  />
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </AppProvider>
  );
};

export default App;