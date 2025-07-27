import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';

// Context for managing global state
const AppContext = createContext();

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// Language translations
const translations = {
  en: {
    title: "Trinjty Bus",
    subtitle: "Cross-Border Travel Made Easy",
    heroDescription: "Book your journey across East Africa with comfort and reliability. Travel between Kenya, Rwanda, Uganda, and Tanzania.",
    bookNow: "Book Your Journey",
    adminDashboard: "Admin Dashboard",
    trackJourney: "Track Journey",
    fromCity: "From",
    toCity: "To",
    travelDate: "Travel Date",
    searchBuses: "Search Buses",
    selectSeats: "Select Your Seats",
    passengers: "Passengers",
    totalPrice: "Total Price",
    bookingDetails: "Booking Details",
    passengerInfo: "Passenger Information",
    paymentMethod: "Payment Method",
    confirmBooking: "Confirm Booking",
    fullName: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    backToSearch: "Back to Search",
    backToSeats: "Back to Seat Selection",
    proceedToPayment: "Proceed to Payment",
    economy: "Economy",
    premium: "Premium",
    available: "Available",
    selected: "Selected",
    booked: "Booked",
    bookingConfirmed: "Booking Confirmed!",
    downloadTicket: "Download Ticket",
    newBooking: "New Booking",
    trackingInfo: "Journey Tracking",
    currentLocation: "Current Location",
    estimatedArrival: "Estimated Arrival",
    busStatus: "Bus Status",
    yourLocation: "Your Location"
  },
  sw: {
    title: "Trinjty Bus",
    subtitle: "Safari za Kimataifa Zimerahisishwa",
    heroDescription: "Hifadhi safari yako katika Afrika Mashariki kwa starehe na kuaminika. Safiri kati ya Kenya, Rwanda, Uganda, na Tanzania.",
    bookNow: "Hifadhi Safari Yako",
    adminDashboard: "Dashibodi ya Msimamizi",
    trackJourney: "Fuatilia Safari",
    fromCity: "Kutoka",
    toCity: "Kwenda",
    travelDate: "Tarehe ya Safari",
    searchBuses: "Tafuta Mabasi",
    selectSeats: "Chagua Viti Vyako",
    passengers: "Abiria",
    totalPrice: "Jumla ya Bei",
    bookingDetails: "Maelezo ya Uhifadhi",
    passengerInfo: "Taarifa za Abiria",
    paymentMethod: "Njia ya Malipo",
    confirmBooking: "Thibitisha Uhifadhi",
    fullName: "Jina Kamili",
    email: "Barua Pepe",
    phone: "Nambari ya Simu",
    backToSearch: "Rudi Utafutaji",
    backToSeats: "Rudi Uchaguzi wa Viti",
    proceedToPayment: "Endelea Malipo",
    economy: "Kawaida",
    premium: "Bora",
    available: "Inapatikana",
    selected: "Imechaguliwa",
    booked: "Imehifadhiwa",
    bookingConfirmed: "Uhifadhi Umethibitishwa!",
    downloadTicket: "Pakua Tiketi",
    newBooking: "Uhifadhi Mpya",
    trackingInfo: "Ufuatiliaji wa Safari",
    currentLocation: "Mahali pa Sasa",
    estimatedArrival: "Muda wa Kuwasili",
    busStatus: "Hali ya Basi",
    yourLocation: "Mahali Pako"
  },
  fr: {
    title: "Trinjty Bus",
    subtitle: "Voyages Transfrontaliers Simplifiés",
    heroDescription: "Réservez votre voyage à travers l'Afrique de l'Est avec confort et fiabilité. Voyagez entre le Kenya, le Rwanda, l'Ouganda et la Tanzanie.",
    bookNow: "Réservez Votre Voyage",
    adminDashboard: "Tableau de Bord Admin",
    trackJourney: "Suivre Voyage",
    fromCity: "De", 
    toCity: "À",
    travelDate: "Date de Voyage",
    searchBuses: "Rechercher Bus",
    selectSeats: "Sélectionner Vos Sièges",
    passengers: "Passagers",
    totalPrice: "Prix Total",
    bookingDetails: "Détails de Réservation",
    passengerInfo: "Informations Passager",
    paymentMethod: "Méthode de Paiement",
    confirmBooking: "Confirmer Réservation",
    fullName: "Nom Complet",
    email: "Adresse Email",
    phone: "Numéro de Téléphone",
    backToSearch: "Retour Recherche",
    backToSeats: "Retour Sélection Sièges",
    proceedToPayment: "Procéder au Paiement",
    economy: "Économique",
    premium: "Premium",
    available: "Disponible",
    selected: "Sélectionné",
    booked: "Réservé",
    bookingConfirmed: "Réservation Confirmée!",
    downloadTicket: "Télécharger Billet",
    newBooking: "Nouvelle Réservation",
    trackingInfo: "Suivi du Voyage",
    currentLocation: "Position Actuelle",
    estimatedArrival: "Arrivée Estimée",
    busStatus: "Statut du Bus",
    yourLocation: "Votre Position"
  }
};

// API base URL
const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Map Component using OpenStreetMap
const MapView = ({ route, currentLocation, userLocation, showRoute = true }) => {
  const mapRef = React.useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!window.L) {
      // Load Leaflet dynamically
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCSS);

      const leafletJS = document.createElement('script');
      leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletJS.onload = initializeMap;
      document.head.appendChild(leafletJS);
    } else {
      initializeMap();
    }
  }, []);

  const initializeMap = () => {
    if (mapRef.current && window.L && !map) {
      const newMap = window.L.map(mapRef.current).setView([-1.2864, 36.8172], 6);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(newMap);

      setMap(newMap);
    }
  };

  useEffect(() => {
    if (map && route) {
      // Clear existing markers and routes
      map.eachLayer((layer) => {
        if (layer instanceof window.L.Marker || layer instanceof window.L.Polyline) {
          map.removeLayer(layer);
        }
      });

      // Add route waypoints
      if (showRoute && route.waypoints && route.waypoints.length > 0) {
        const polyline = window.L.polyline(route.waypoints, { color: 'blue', weight: 3 }).addTo(map);
        map.fitBounds(polyline.getBounds());
        
        // Origin marker
        window.L.marker(route.origin_coords)
          .addTo(map)
          .bindPopup(`Origin: ${route.origin}`)
          .openPopup();
        
        // Destination marker
        window.L.marker(route.destination_coords)
          .addTo(map)
          .bindPopup(`Destination: ${route.destination}`);
      }

      // Current bus location
      if (currentLocation && currentLocation.length === 2) {
        const busIcon = window.L.divIcon({
          html: '🚌',
          iconSize: [30, 30],
          className: 'bus-marker'
        });
        
        window.L.marker(currentLocation, { icon: busIcon })
          .addTo(map)
          .bindPopup('Current Bus Location');
      }

      // User location
      if (userLocation && userLocation.length === 2) {
        const userIcon = window.L.divIcon({
          html: '📍',
          iconSize: [25, 25],
          className: 'user-marker'
        });
        
        window.L.marker(userLocation, { icon: userIcon })
          .addTo(map)
          .bindPopup('Your Location');
      }
    }
  }, [map, route, currentLocation, userLocation, showRoute]);

  return <div ref={mapRef} className="w-full h-96 rounded-lg shadow-lg"></div>;
};

// Hero Section Component
const HeroSection = () => {
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
          <button 
            onClick={() => document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            {t.bookNow}
          </button>
          <button 
            onClick={() => setCurrentView('admin')}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            {t.adminDashboard}
          </button>
        </div>
      </div>
    </div>
  );
};

// Navigation Component
const Navigation = () => {
  const { language, setCurrentView, currentView } = useAppContext();
  const t = translations[language];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-blue-600">{t.title}</h1>
            <div className="hidden md:flex space-x-4">
              <button
                onClick={() => setCurrentView('booking')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  currentView === 'booking' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                {t.bookNow}
              </button>
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  currentView === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                {t.adminDashboard}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

};

// Language Selector Component
const LanguageSelector = () => {
  const { language, setLanguage } = useAppContext();

  return (
    <div className="fixed top-4 right-4 z-50">
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium shadow-lg"
      >
        <option value="en">🇬🇧 English</option>
        <option value="sw">🇰🇪 Kiswahili</option>
        <option value="fr">🇷🇼 Français</option>
      </select>
    </div>
  );
};

// Journey Tracking Component
const JourneyTracking = ({ bookingId, onBack }) => {
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

// Admin Dashboard Component
const AdminDashboard = () => {
  const { language } = useAppContext();
  const t = translations[language];
  const [dashboardData, setDashboardData] = useState(null);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
    fetchBuses();
    fetchRoutes();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/dashboard`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchBuses = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/buses`);
      const data = await response.json();
      setBuses(data.buses);
    } catch (error) {
      console.error('Error fetching buses:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/routes`);
      const data = await response.json();
      setRoutes(data.routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const StatCard = ({ title, value, icon, color = "blue" }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
        </div>
        <div className={`text-4xl text-${color}-500`}>{icon}</div>
      </div>
    </div>
  );

  if (!dashboardData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
          
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-200 rounded-lg p-1">
            {['overview', 'buses', 'routes', 'bookings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Bookings"
                value={dashboardData.stats.total_bookings}
                icon="📊"
                color="blue"
              />
              <StatCard
                title="Today's Bookings"
                value={dashboardData.stats.today_bookings}
                icon="🎫"
                color="green"
              />
              <StatCard
                title="Active Buses"
                value={dashboardData.stats.active_buses}
                icon="🚌"
                color="yellow"
              />
              <StatCard
                title="Total Revenue"
                value={`${dashboardData.stats.total_revenue.toLocaleString()} KES`}
                icon="💰"
                color="purple"
              />
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Recent Bookings</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Booking ID</th>
                      <th className="text-left py-3">Route</th>
                      <th className="text-left py-3">Seats</th>
                      <th className="text-left py-3">Price</th>
                      <th className="text-left py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recent_bookings.map((booking) => (
                      <tr key={booking.booking_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-mono text-sm">{booking.booking_id.slice(0, 8)}...</td>
                        <td className="py-3">{booking.route_id}</td>
                        <td className="py-3">{booking.seat_numbers.join(', ')}</td>
                        <td className="py-3">{booking.total_price} {booking.currency}</td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'buses' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Fleet Management</h3>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                Add New Bus
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {buses.map((bus) => (
                <div key={bus.bus_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{bus.bus_number}</h4>
                      <p className="text-gray-600">{bus.route_name}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      bus.status === 'in_transit' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bus.status}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Departure</p>
                      <p className="font-semibold">{bus.departure_time}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Passengers</p>
                      <p className="font-semibold">{bus.passenger_count}/{bus.capacity}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(bus.passenger_count / bus.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Route Management</h3>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                Add New Route
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {routes.map((route) => (
                <div key={route.route_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{route.origin} → {route.destination}</h4>
                      <p className="text-gray-600">{route.country_origin} to {route.country_destination}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{route.base_price} {route.currency}</p>
                      <p className="text-sm text-gray-600">{route.duration_hours}h journey</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <MapView
                      route={route}
                      currentLocation={null}
                      userLocation={null}
                      showRoute={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Search Form Component (same as before, but with tracking button)
const SearchForm = ({ onSearch }) => {
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

// Rest of the components remain the same (BusList, SeatSelection, PassengerForm, BookingConfirmation)
const BusList = ({ buses, onSelectBus }) => {
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
            <button
              onClick={() => onSelectBus(bus)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
            >
              {t.selectSeats}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const SeatSelection = ({ bus, onSeatSelect, selectedSeats }) => {
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

const PassengerForm = ({ selectedSeats, bus, onSubmit, onBack }) => {
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

const BookingConfirmation = ({ booking, onNewBooking, onTrackJourney }) => {
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
        <button
          onClick={() => onTrackJourney(booking.booking_id)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300"
        >
          {t.trackJourney}
        </button>
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300">
          {t.downloadTicket}
        </button>
        <button
          onClick={onNewBooking}
          className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300"
        >
          {t.newBooking}
        </button>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [language, setLanguage] = useState('en');
  const [currentView, setCurrentView] = useState('booking'); // booking, admin, tracking
  const [currentStep, setCurrentStep] = useState('search'); // search, buses, seats, passenger, confirmation, tracking
  const [searchResults, setSearchResults] = useState({});
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [trackingBookingId, setTrackingBookingId] = useState(null);

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
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <LanguageSelector />
        
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
                    <button
                      onClick={() => setCurrentStep('search')}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      {t.backToSearch}
                    </button>
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
                    <button
                      onClick={() => setCurrentStep('buses')}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      Back to Buses
                    </button>
                  </div>
                  <SeatSelection 
                    bus={selectedBus} 
                    onSeatSelect={handleSeatSelect}
                    selectedSeats={selectedSeats}
                  />
                  {selectedSeats.length > 0 && (
                    <div className="text-center mt-8">
                      <button
                        onClick={handleProceedToPassenger}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300"
                      >
                        {t.proceedToPayment}
                      </button>
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
    </AppContext.Provider>
  );
};

export default App;