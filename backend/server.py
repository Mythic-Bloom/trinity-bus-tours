import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import qrcode
import base64
from io import BytesIO
import json
import math

# MongoDB setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client.trinjty_bus

app = FastAPI(title="Trinjty Bus Booking API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class User(BaseModel):
    user_id: str = None
    email: str
    full_name: str
    phone: str
    preferred_language: str = "en"
    
class Route(BaseModel):
    route_id: str
    origin: str
    destination: str
    country_origin: str
    country_destination: str
    duration_hours: int
    base_price: float
    currency: str
    origin_coords: List[float]
    destination_coords: List[float]
    waypoints: List[List[float]] = []

class Bus(BaseModel):
    bus_id: str
    route_id: str
    departure_time: str
    arrival_time: str
    date: str
    total_seats: int
    available_seats: List[int]
    seat_layout: Dict[str, Any]
    driver_name: str = ""
    driver_phone: str = ""
    bus_number: str = ""
    current_location: List[float] = []
    status: str = "scheduled"  # scheduled, departed, in_transit, arrived, delayed

class Booking(BaseModel):
    booking_id: str = None
    user_id: str
    bus_id: str
    route_id: str
    seat_numbers: List[int]
    passenger_names: List[str]
    total_price: float
    currency: str
    booking_date: str = None
    travel_date: str
    status: str = "confirmed"
    payment_status: str = "pending"
    qr_code: str = None

class BusFleet(BaseModel):
    fleet_id: str = None
    bus_number: str
    capacity: int
    bus_type: str  # economy, premium, sleeper
    year: int
    status: str = "active"  # active, maintenance, retired
    current_route_id: str = None
    last_maintenance: str = None
    next_maintenance: str = None

class TrackingUpdate(BaseModel):
    bus_id: str
    latitude: float
    longitude: float
    timestamp: str = None
    speed: float = 0.0
    heading: float = 0.0

# Routes data with coordinates
ROUTES_DATA = [
    {
        "route_id": "KE-RW-001",
        "origin": "Nairobi",
        "destination": "Kigali",
        "country_origin": "Kenya",
        "country_destination": "Rwanda",
        "duration_hours": 12,
        "base_price": 4500,
        "currency": "KES",
        "origin_coords": [-1.2864, 36.8172],  # Nairobi
        "destination_coords": [-1.9441, 30.0619],  # Kigali
        "waypoints": [
            [-1.2864, 36.8172],  # Nairobi
            [-0.7893, 36.0822],  # Naivasha
            [-0.2827, 36.0800],  # Nakuru
            [-0.0917, 34.7680],  # Kisumu
            [-1.9441, 30.0619]   # Kigali
        ]
    },
    {
        "route_id": "UG-TZ-001", 
        "origin": "Kampala",
        "destination": "Dar es Salaam",
        "country_origin": "Uganda",
        "country_destination": "Tanzania",
        "duration_hours": 18,
        "base_price": 85000,
        "currency": "UGX",
        "origin_coords": [0.3476, 32.5825],   # Kampala
        "destination_coords": [-6.7924, 39.2083],  # Dar es Salaam
        "waypoints": [
            [0.3476, 32.5825],   # Kampala
            [-1.2741, 32.3023],  # Masaka
            [-2.9734, 32.7986],  # Bukoba
            [-6.7924, 39.2083]   # Dar es Salaam
        ]
    },
    {
        "route_id": "KE-UG-001",
        "origin": "Nairobi",
        "destination": "Kampala", 
        "country_origin": "Kenya",
        "country_destination": "Uganda",
        "duration_hours": 8,
        "base_price": 3500,
        "currency": "KES",
        "origin_coords": [-1.2864, 36.8172],  # Nairobi
        "destination_coords": [0.3476, 32.5825],  # Kampala
        "waypoints": [
            [-1.2864, 36.8172],  # Nairobi
            [-0.0917, 34.7680],  # Kisumu
            [0.3476, 32.5825]    # Kampala
        ]
    },
    {
        "route_id": "RW-TZ-001",
        "origin": "Kigali",
        "destination": "Dar es Salaam",
        "country_origin": "Rwanda", 
        "country_destination": "Tanzania",
        "duration_hours": 15,
        "base_price": 35000,
        "currency": "RWF",
        "origin_coords": [-1.9441, 30.0619],  # Kigali
        "destination_coords": [-6.7924, 39.2083],  # Dar es Salaam
        "waypoints": [
            [-1.9441, 30.0619],  # Kigali
            [-2.9734, 32.7986],  # Bukoba
            [-6.7924, 39.2083]   # Dar es Salaam
        ]
    }
]

# Seat layout for different bus types
SEAT_LAYOUTS = {
    "economy": {
        "rows": 12,
        "seats_per_row": 4,
        "total_seats": 48,
        "layout": [[1,2,"",3,4], [5,6,"",7,8], [9,10,"",11,12], [13,14,"",15,16], [17,18,"",19,20], [21,22,"",23,24], [25,26,"",27,28], [29,30,"",31,32], [33,34,"",35,36], [37,38,"",39,40], [41,42,"",43,44], [45,46,"",47,48]]
    },
    "premium": {
        "rows": 10,
        "seats_per_row": 3,
        "total_seats": 30,
        "layout": [[1,2,"",3], [4,5,"",6], [7,8,"",9], [10,11,"",12], [13,14,"",15], [16,17,"",18], [19,20,"",21], [22,23,"",24], [25,26,"",27], [28,29,"",30]]
    }
}

def generate_qr_code(booking_data: str) -> str:
    """Generate QR code for booking"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(booking_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

def serialize_mongo_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    doc_copy = dict(doc)
    if "_id" in doc_copy:
        del doc_copy["_id"]
    return doc_copy

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in kilometers"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def simulate_bus_location(route_id: str, departure_time: str, date: str):
    """Simulate current bus location based on time elapsed"""
    route = next((r for r in ROUTES_DATA if r["route_id"] == route_id), None)
    if not route:
        return route["origin_coords"]
    
    try:
        departure_dt = datetime.strptime(f"{date} {departure_time}", "%Y-%m-%d %H:%M")
        now = datetime.now()
        
        if now < departure_dt:
            # Bus hasn't departed yet
            return route["origin_coords"]
        
        elapsed_hours = (now - departure_dt).total_seconds() / 3600
        total_hours = route["duration_hours"]
        
        if elapsed_hours >= total_hours:
            # Bus has arrived
            return route["destination_coords"]
        
        # Calculate position along route
        progress = elapsed_hours / total_hours
        waypoints = route["waypoints"]
        
        if len(waypoints) < 2:
            # Linear interpolation between origin and destination
            lat = route["origin_coords"][0] + (route["destination_coords"][0] - route["origin_coords"][0]) * progress
            lon = route["origin_coords"][1] + (route["destination_coords"][1] - route["origin_coords"][1]) * progress
            return [lat, lon]
        
        # Find position along waypoints
        segment_progress = progress * (len(waypoints) - 1)
        segment_index = int(segment_progress)
        segment_fraction = segment_progress - segment_index
        
        if segment_index >= len(waypoints) - 1:
            return waypoints[-1]
        
        start_point = waypoints[segment_index]
        end_point = waypoints[segment_index + 1]
        
        lat = start_point[0] + (end_point[0] - start_point[0]) * segment_fraction
        lon = start_point[1] + (end_point[1] - start_point[1]) * segment_fraction
        
        return [lat, lon]
        
    except Exception as e:
        return route["origin_coords"]

# API Endpoints

@app.get("/api/routes")
async def get_routes():
    """Get all available routes"""
    return {"routes": ROUTES_DATA}

@app.get("/api/routes/search")
async def search_routes(origin: str, destination: str):
    """Search routes by origin and destination"""
    matching_routes = [
        route for route in ROUTES_DATA 
        if route["origin"].lower() == origin.lower() and route["destination"].lower() == destination.lower()
    ]
    return {"routes": matching_routes}

@app.get("/api/buses/{route_id}")
async def get_buses_for_route(route_id: str, date: str):
    """Get available buses for a route on a specific date"""
    buses = []
    departure_times = ["06:00", "10:00", "14:00", "18:00", "22:00"]
    
    for i, departure in enumerate(departure_times):
        route = next((r for r in ROUTES_DATA if r["route_id"] == route_id), None)
        if route:
            departure_dt = datetime.strptime(f"{date} {departure}", "%Y-%m-%d %H:%M")
            arrival_dt = departure_dt + timedelta(hours=route["duration_hours"])
            
            bus_id = f"{route_id}-{date}-{departure.replace(':', '')}"
            bus_type = "economy" if i % 2 == 0 else "premium"
            layout = SEAT_LAYOUTS[bus_type]
            
            # Mock some booked seats
            booked_seats = [1, 2, 15, 16, 30] if i == 0 else [5, 6, 20]
            available_seats = [seat for seat in range(1, layout["total_seats"] + 1) if seat not in booked_seats]
            
            # Simulate current location
            current_location = simulate_bus_location(route_id, departure, date)
            
            buses.append({
                "bus_id": bus_id,
                "route_id": route_id,
                "departure_time": departure,
                "arrival_time": arrival_dt.strftime("%H:%M"),
                "date": date,
                "total_seats": layout["total_seats"],
                "available_seats": available_seats,
                "seat_layout": layout,
                "bus_type": bus_type,
                "price": route["base_price"] * (1.5 if bus_type == "premium" else 1.0),
                "driver_name": f"Driver {i+1}",
                "driver_phone": f"+25470000000{i}",
                "bus_number": f"TRB-{route_id[-3:]}{i:02d}",
                "current_location": current_location,
                "status": "in_transit" if datetime.now() > departure_dt else "scheduled"
            })
    
    return {"buses": buses}

@app.post("/api/users")
async def create_user(user: User):
    """Create a new user"""
    user_id = str(uuid.uuid4())
    
    existing_user = db.users.find_one({"email": user.email})
    if existing_user:
        return {"user": serialize_mongo_doc(existing_user)}
    
    user_data = {
        "user_id": user_id,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "preferred_language": user.preferred_language,
        "created_at": datetime.now().isoformat()
    }
    
    db.users.insert_one(user_data.copy())
    return {"user": user_data}

@app.get("/api/users/{email}")
async def get_user_by_email(email: str):
    """Get user by email"""
    user = db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": serialize_mongo_doc(user)}

@app.post("/api/bookings")
async def create_booking(booking: Booking):
    """Create a new booking"""
    booking_id = str(uuid.uuid4())
    booking_date = datetime.now().isoformat()
    
    qr_data = {
        "booking_id": booking_id,
        "bus_id": booking.bus_id,
        "seats": booking.seat_numbers,
        "travel_date": booking.travel_date
    }
    qr_code = generate_qr_code(json.dumps(qr_data))
    
    booking_data = {
        "booking_id": booking_id,
        "user_id": booking.user_id,
        "bus_id": booking.bus_id,
        "route_id": booking.route_id,
        "seat_numbers": booking.seat_numbers,
        "passenger_names": booking.passenger_names,
        "total_price": booking.total_price,
        "currency": booking.currency,
        "booking_date": booking_date,
        "travel_date": booking.travel_date,
        "status": booking.status,
        "payment_status": booking.payment_status,
        "qr_code": qr_code
    }
    
    db.bookings.insert_one(booking_data.copy())
    return {"booking": booking_data}

@app.get("/api/bookings/user/{user_id}")
async def get_user_bookings(user_id: str):
    """Get all bookings for a user"""
    bookings = list(db.bookings.find({"user_id": user_id}))
    return {"bookings": [serialize_mongo_doc(booking) for booking in bookings]}

@app.get("/api/bookings/{booking_id}")
async def get_booking(booking_id: str):
    """Get specific booking details"""
    booking = db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"booking": serialize_mongo_doc(booking)}

@app.get("/api/bookings/{booking_id}/track")
async def track_booking(booking_id: str):
    """Track a specific booking's journey"""
    booking = db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Get bus details
    bus_id = booking["bus_id"]
    route_id = booking["route_id"]
    travel_date = booking["travel_date"]
    
    # Extract departure time from bus_id
    departure_time = bus_id.split("-")[-1]
    departure_time = f"{departure_time[:2]}:{departure_time[2:]}"
    
    # Get route information
    route = next((r for r in ROUTES_DATA if r["route_id"] == route_id), None)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    # Calculate current location
    current_location = simulate_bus_location(route_id, departure_time, travel_date)
    
    # Calculate progress
    departure_dt = datetime.strptime(f"{travel_date} {departure_time}", "%Y-%m-%d %H:%M")
    now = datetime.now()
    elapsed_hours = max(0, (now - departure_dt).total_seconds() / 3600)
    progress_percentage = min(100, (elapsed_hours / route["duration_hours"]) * 100)
    
    # Determine status
    if now < departure_dt:
        status = "scheduled"
        eta = departure_dt.isoformat()
    elif elapsed_hours >= route["duration_hours"]:
        status = "arrived"
        eta = (departure_dt + timedelta(hours=route["duration_hours"])).isoformat()
    else:
        status = "in_transit"
        remaining_hours = route["duration_hours"] - elapsed_hours
        eta = (now + timedelta(hours=remaining_hours)).isoformat()
    
    return {
        "booking_id": booking_id,
        "route": route,
        "current_location": current_location,
        "progress_percentage": progress_percentage,
        "status": status,
        "eta": eta,
        "departure_time": departure_time,
        "travel_date": travel_date
    }

@app.post("/api/payment/mock")
async def mock_payment(payment_data: dict):
    """Mock payment processing"""
    booking_id = payment_data.get("booking_id")
    payment_method = payment_data.get("payment_method", "m-pesa")
    amount = payment_data.get("amount")
    
    result = db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"payment_status": "completed", "payment_method": payment_method}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {
        "status": "success",
        "transaction_id": str(uuid.uuid4()),
        "message": f"Payment of {amount} processed successfully via {payment_method}"
    }

@app.get("/api/countries")
async def get_countries():
    """Get available countries and cities"""
    countries_cities = {
        "Kenya": ["Nairobi", "Mombasa", "Kisumu"],
        "Rwanda": ["Kigali", "Butare", "Gisenyi"], 
        "Uganda": ["Kampala", "Entebbe", "Jinja"],
        "Tanzania": ["Dar es Salaam", "Arusha", "Mwanza"]
    }
    return {"countries": countries_cities}

# ADMIN ENDPOINTS

@app.get("/api/admin/dashboard")
async def admin_dashboard():
    """Get admin dashboard overview"""
    # Get today's stats
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Mock statistics
    total_bookings = len(list(db.bookings.find()))
    today_bookings = len(list(db.bookings.find({"travel_date": today})))
    total_revenue = sum([booking.get("total_price", 0) for booking in db.bookings.find()])
    active_buses = 20  # Mock data
    
    return {
        "stats": {
            "total_bookings": total_bookings,
            "today_bookings": today_bookings,
            "total_revenue": total_revenue,
            "active_buses": active_buses,
            "routes": len(ROUTES_DATA)
        },
        "recent_bookings": [serialize_mongo_doc(booking) for booking in db.bookings.find().sort("booking_date", -1).limit(10)]
    }

@app.get("/api/admin/buses")
async def admin_get_all_buses():
    """Get all buses with their current status"""
    all_buses = []
    
    for route in ROUTES_DATA:
        for i, departure in enumerate(["06:00", "10:00", "14:00", "18:00", "22:00"]):
            bus_id = f"{route['route_id']}-{datetime.now().strftime('%Y-%m-%d')}-{departure.replace(':', '')}"
            current_location = simulate_bus_location(route["route_id"], departure, datetime.now().strftime('%Y-%m-%d'))
            
            bus = {
                "bus_id": bus_id,
                "bus_number": f"TRB-{route['route_id'][-3:]}{i:02d}",
                "route_id": route["route_id"],
                "route_name": f"{route['origin']} → {route['destination']}",
                "departure_time": departure,
                "current_location": current_location,
                "status": "in_transit" if datetime.now().hour > int(departure.split(':')[0]) else "scheduled",
                "passenger_count": 35 - (i * 5),  # Mock passenger count
                "capacity": 48 if i % 2 == 0 else 30
            }
            all_buses.append(bus)
    
    return {"buses": all_buses}

@app.post("/api/admin/buses")
async def admin_add_bus(bus_data: dict):
    """Add a new bus to the fleet"""
    bus_id = str(uuid.uuid4())
    
    fleet_data = {
        "fleet_id": bus_id,
        "bus_number": bus_data["bus_number"],
        "capacity": bus_data["capacity"],
        "bus_type": bus_data["bus_type"],
        "year": bus_data.get("year", 2023),
        "status": "active",
        "created_at": datetime.now().isoformat()
    }
    
    db.fleet.insert_one(fleet_data.copy())
    return {"message": "Bus added successfully", "bus": fleet_data}

@app.get("/api/admin/routes")
async def admin_get_routes():
    """Get all routes for admin management"""
    return {"routes": ROUTES_DATA}

@app.post("/api/admin/routes")
async def admin_add_route(route_data: dict):
    """Add a new route"""
    route_id = f"{route_data['country_origin'][:2].upper()}-{route_data['country_destination'][:2].upper()}-{str(uuid.uuid4())[:3]}"
    
    new_route = {
        "route_id": route_id,
        "origin": route_data["origin"],
        "destination": route_data["destination"],
        "country_origin": route_data["country_origin"],
        "country_destination": route_data["country_destination"],
        "duration_hours": route_data["duration_hours"],
        "base_price": route_data["base_price"],
        "currency": route_data["currency"],
        "origin_coords": route_data["origin_coords"],
        "destination_coords": route_data["destination_coords"],
        "waypoints": route_data.get("waypoints", []),
        "created_at": datetime.now().isoformat()
    }
    
    # In a real app, this would be stored in database
    ROUTES_DATA.append(new_route)
    
    return {"message": "Route added successfully", "route": new_route}

@app.get("/api/admin/bookings")
async def admin_get_bookings(limit: int = 50):
    """Get all bookings for admin view"""
    bookings = list(db.bookings.find().sort("booking_date", -1).limit(limit))
    return {"bookings": [serialize_mongo_doc(booking) for booking in bookings]}

@app.post("/api/tracking/update")
async def update_bus_location(tracking_data: TrackingUpdate):
    """Update bus location (for real GPS integration)"""
    tracking_data.timestamp = datetime.now().isoformat()
    
    # Store tracking data
    tracking_record = tracking_data.dict()
    db.tracking.insert_one(tracking_record)
    
    return {"message": "Location updated successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)