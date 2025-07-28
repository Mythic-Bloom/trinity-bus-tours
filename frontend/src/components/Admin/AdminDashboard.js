
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { translations } from '../../translations';
import { API_BASE } from '../../config/config';
import { MapView } from '../MapView';

export const AdminDashboard = () => {
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
