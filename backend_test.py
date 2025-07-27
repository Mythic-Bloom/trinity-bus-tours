#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Trinjty Bus Booking Platform
Tests all backend APIs according to the test plan in test_result.md
"""

import requests
import json
import uuid
from datetime import datetime, timedelta
import sys

# Use the production backend URL from frontend/.env
BASE_URL = "https://27c3e827-8b12-41df-9ea2-6fd42295655d.preview.emergentagent.com/api"

class TrinjtyBusAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_results = []
        self.created_user_id = None
        self.created_booking_id = None
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def test_routes_api(self):
        """Test GET /api/routes - Get all available routes"""
        print("\n=== Testing Routes API ===")
        
        try:
            response = requests.get(f"{self.base_url}/routes", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                routes = data.get("routes", [])
                
                # Verify we have the expected cross-border routes
                expected_routes = ["KE-RW-001", "UG-TZ-001", "KE-UG-001", "RW-TZ-001"]
                found_routes = [route["route_id"] for route in routes]
                
                if len(routes) >= 4 and all(route_id in found_routes for route_id in expected_routes):
                    self.log_test("GET /api/routes", True, f"Found {len(routes)} routes including all expected cross-border routes")
                    
                    # Test specific route details
                    nairobi_kigali = next((r for r in routes if r["route_id"] == "KE-RW-001"), None)
                    if nairobi_kigali:
                        if (nairobi_kigali["origin"] == "Nairobi" and 
                            nairobi_kigali["destination"] == "Kigali" and
                            nairobi_kigali["currency"] == "KES"):
                            self.log_test("Route details validation", True, "Nairobi→Kigali route has correct details")
                        else:
                            self.log_test("Route details validation", False, "Route details incorrect")
                    else:
                        self.log_test("Route details validation", False, "Nairobi→Kigali route not found")
                else:
                    self.log_test("GET /api/routes", False, f"Expected 4+ routes with specific IDs, got {len(routes)}")
            else:
                self.log_test("GET /api/routes", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/routes", False, f"Exception: {str(e)}")
    
    def test_routes_search(self):
        """Test GET /api/routes/search - Search routes by origin/destination"""
        print("\n=== Testing Routes Search API ===")
        
        test_cases = [
            ("Nairobi", "Kigali", "KE-RW-001"),
            ("Kampala", "Dar es Salaam", "UG-TZ-001"),
            ("Nairobi", "Kampala", "KE-UG-001"),
            ("Kigali", "Dar es Salaam", "RW-TZ-001"),
            ("NonExistent", "City", None)  # Should return empty
        ]
        
        for origin, destination, expected_route_id in test_cases:
            try:
                response = requests.get(
                    f"{self.base_url}/routes/search",
                    params={"origin": origin, "destination": destination},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    routes = data.get("routes", [])
                    
                    if expected_route_id is None:
                        # Should be empty for non-existent routes
                        if len(routes) == 0:
                            self.log_test(f"Search {origin}→{destination}", True, "Correctly returned empty for non-existent route")
                        else:
                            self.log_test(f"Search {origin}→{destination}", False, "Should return empty for non-existent route")
                    else:
                        # Should find the expected route
                        if len(routes) == 1 and routes[0]["route_id"] == expected_route_id:
                            self.log_test(f"Search {origin}→{destination}", True, f"Found correct route {expected_route_id}")
                        else:
                            self.log_test(f"Search {origin}→{destination}", False, f"Expected route {expected_route_id}, got {[r['route_id'] for r in routes]}")
                else:
                    self.log_test(f"Search {origin}→{destination}", False, f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Search {origin}→{destination}", False, f"Exception: {str(e)}")
    
    def test_buses_api(self):
        """Test GET /api/buses/{route_id} - Get buses for route and date"""
        print("\n=== Testing Bus Management API ===")
        
        # Test with different routes and dates
        test_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        test_routes = ["KE-RW-001", "UG-TZ-001", "KE-UG-001"]
        
        for route_id in test_routes:
            try:
                response = requests.get(
                    f"{self.base_url}/buses/{route_id}",
                    params={"date": test_date},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    buses = data.get("buses", [])
                    
                    if len(buses) >= 5:  # Should have 5 departure times
                        # Check bus details
                        economy_buses = [b for b in buses if b.get("bus_type") == "economy"]
                        premium_buses = [b for b in buses if b.get("bus_type") == "premium"]
                        
                        if len(economy_buses) > 0 and len(premium_buses) > 0:
                            # Check seat layouts
                            economy_bus = economy_buses[0]
                            premium_bus = premium_buses[0]
                            
                            economy_seats = economy_bus.get("total_seats", 0)
                            premium_seats = premium_bus.get("total_seats", 0)
                            
                            if economy_seats == 48 and premium_seats == 30:
                                self.log_test(f"Buses for {route_id}", True, f"Found {len(buses)} buses with correct seat layouts")
                                
                                # Test seat availability
                                available_seats = economy_bus.get("available_seats", [])
                                if len(available_seats) > 40:  # Should have most seats available
                                    self.log_test(f"Seat availability {route_id}", True, f"{len(available_seats)} seats available")
                                else:
                                    self.log_test(f"Seat availability {route_id}", False, f"Only {len(available_seats)} seats available")
                            else:
                                self.log_test(f"Buses for {route_id}", False, f"Incorrect seat counts: economy={economy_seats}, premium={premium_seats}")
                        else:
                            self.log_test(f"Buses for {route_id}", False, "Missing economy or premium buses")
                    else:
                        self.log_test(f"Buses for {route_id}", False, f"Expected 5+ buses, got {len(buses)}")
                else:
                    self.log_test(f"Buses for {route_id}", False, f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Buses for {route_id}", False, f"Exception: {str(e)}")
    
    def test_user_management(self):
        """Test user creation and retrieval"""
        print("\n=== Testing User Management API ===")
        
        # Test user creation
        test_user = {
            "email": f"john.doe.{uuid.uuid4().hex[:8]}@example.com",
            "full_name": "John Doe",
            "phone": "+254712345678",
            "preferred_language": "en"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/users",
                json=test_user,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                user = data.get("user", {})
                
                if user.get("user_id") and user.get("email") == test_user["email"]:
                    self.created_user_id = user["user_id"]
                    self.log_test("POST /api/users", True, f"Created user with ID {self.created_user_id}")
                    
                    # Test user retrieval by email
                    try:
                        get_response = requests.get(
                            f"{self.base_url}/users/{test_user['email']}",
                            timeout=10
                        )
                        
                        if get_response.status_code == 200:
                            get_data = get_response.json()
                            retrieved_user = get_data.get("user", {})
                            
                            if retrieved_user.get("user_id") == self.created_user_id:
                                self.log_test("GET /api/users/{email}", True, "Successfully retrieved user by email")
                            else:
                                self.log_test("GET /api/users/{email}", False, "Retrieved user ID doesn't match")
                        else:
                            self.log_test("GET /api/users/{email}", False, f"HTTP {get_response.status_code}")
                            
                    except Exception as e:
                        self.log_test("GET /api/users/{email}", False, f"Exception: {str(e)}")
                        
                else:
                    self.log_test("POST /api/users", False, "User creation response missing required fields")
            else:
                self.log_test("POST /api/users", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST /api/users", False, f"Exception: {str(e)}")
    
    def test_booking_system(self):
        """Test complete booking creation process"""
        print("\n=== Testing Booking System ===")
        
        if not self.created_user_id:
            self.log_test("Booking creation", False, "No user ID available for booking test")
            return
        
        # Create a booking
        travel_date = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        bus_id = f"KE-RW-001-{travel_date}-0600"
        
        booking_data = {
            "user_id": self.created_user_id,
            "bus_id": bus_id,
            "route_id": "KE-RW-001",
            "seat_numbers": [10, 11],
            "passenger_names": ["John Doe", "Jane Doe"],
            "total_price": 9000.0,
            "currency": "KES",
            "travel_date": travel_date
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/bookings",
                json=booking_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                booking = data.get("booking", {})
                
                if (booking.get("booking_id") and 
                    booking.get("qr_code") and 
                    booking.get("status") == "confirmed"):
                    
                    self.created_booking_id = booking["booking_id"]
                    self.log_test("POST /api/bookings", True, f"Created booking {self.created_booking_id} with QR code")
                    
                    # Verify QR code format
                    qr_code = booking.get("qr_code", "")
                    if qr_code.startswith("data:image/png;base64,"):
                        self.log_test("QR code generation", True, "QR code generated in correct format")
                    else:
                        self.log_test("QR code generation", False, "QR code format incorrect")
                        
                    # Test booking retrieval
                    try:
                        get_response = requests.get(
                            f"{self.base_url}/bookings/{self.created_booking_id}",
                            timeout=10
                        )
                        
                        if get_response.status_code == 200:
                            self.log_test("GET /api/bookings/{booking_id}", True, "Successfully retrieved booking")
                        else:
                            self.log_test("GET /api/bookings/{booking_id}", False, f"HTTP {get_response.status_code}")
                            
                    except Exception as e:
                        self.log_test("GET /api/bookings/{booking_id}", False, f"Exception: {str(e)}")
                        
                else:
                    self.log_test("POST /api/bookings", False, "Booking response missing required fields")
            else:
                self.log_test("POST /api/bookings", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST /api/bookings", False, f"Exception: {str(e)}")
    
    def test_payment_system(self):
        """Test mock payment processing"""
        print("\n=== Testing Payment System ===")
        
        if not self.created_booking_id:
            self.log_test("Payment processing", False, "No booking ID available for payment test")
            return
        
        # Test different payment methods
        payment_methods = ["m-pesa", "airtel-money", "mtn-money", "card"]
        
        for method in payment_methods:
            payment_data = {
                "booking_id": self.created_booking_id,
                "payment_method": method,
                "amount": 9000.0,
                "currency": "KES"
            }
            
            try:
                response = requests.post(
                    f"{self.base_url}/payment/mock",
                    json=payment_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if (data.get("status") == "success" and 
                        data.get("transaction_id") and
                        method in data.get("message", "")):
                        
                        self.log_test(f"Payment via {method}", True, f"Transaction ID: {data['transaction_id']}")
                    else:
                        self.log_test(f"Payment via {method}", False, "Payment response missing required fields")
                else:
                    self.log_test(f"Payment via {method}", False, f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Payment via {method}", False, f"Exception: {str(e)}")
    
    def test_countries_api(self):
        """Test GET /api/countries - Get supported countries and cities"""
        print("\n=== Testing Countries API ===")
        
        try:
            response = requests.get(f"{self.base_url}/countries", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                countries = data.get("countries", {})
                
                expected_countries = ["Kenya", "Rwanda", "Uganda", "Tanzania"]
                
                if all(country in countries for country in expected_countries):
                    # Check if each country has cities
                    all_have_cities = all(
                        isinstance(countries[country], list) and len(countries[country]) > 0
                        for country in expected_countries
                    )
                    
                    if all_have_cities:
                        total_cities = sum(len(cities) for cities in countries.values())
                        self.log_test("GET /api/countries", True, f"Found all 4 countries with {total_cities} total cities")
                        
                        # Verify specific cities
                        if ("Nairobi" in countries.get("Kenya", []) and
                            "Kigali" in countries.get("Rwanda", []) and
                            "Kampala" in countries.get("Uganda", []) and
                            "Dar es Salaam" in countries.get("Tanzania", [])):
                            self.log_test("Major cities validation", True, "All major cities found")
                        else:
                            self.log_test("Major cities validation", False, "Some major cities missing")
                    else:
                        self.log_test("GET /api/countries", False, "Some countries have no cities")
                else:
                    missing = [c for c in expected_countries if c not in countries]
                    self.log_test("GET /api/countries", False, f"Missing countries: {missing}")
            else:
                self.log_test("GET /api/countries", False, f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("GET /api/countries", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print(f"🚌 Starting Trinjty Bus Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run tests in logical order
        self.test_countries_api()
        self.test_routes_api()
        self.test_routes_search()
        self.test_buses_api()
        self.test_user_management()
        self.test_booking_system()
        self.test_payment_system()
        
        # Summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = TrinjtyBusAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)