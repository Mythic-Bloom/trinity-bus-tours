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

class Bus(BaseModel):
    bus_id: str
    route_id: str
    departure_time: str
    arrival_time: str
    date: str
    total_seats: int
    available_seats: List[int]
    seat_layout: Dict[str, Any]

class Booking(BaseModel):
    booking_id: str = None
    user_id: str
    bus_id: str
    route_id: str
    seat_numbers: List[int]
    passenger_names: List[str]
    total_price: float
    currency: str
    booking_date: str
    travel_date: str
    status: str = "confirmed"
    payment_status: str = "pending"
    qr_code: str = None

# Routes data
ROUTES_DATA = [
    {
        "route_id": "KE-RW-001",
        "origin": "Nairobi",
        "destination": "Kigali",
        "country_origin": "Kenya",
        "country_destination": "Rwanda",
        "duration_hours": 12,
        "base_price": 4500,
        "currency": "KES"
    },
    {
        "route_id": "UG-TZ-001", 
        "origin": "Kampala",
        "destination": "Dar es Salaam",
        "country_origin": "Uganda",
        "country_destination": "Tanzania",
        "duration_hours": 18,
        "base_price": 85000,
        "currency": "UGX"
    },
    {
        "route_id": "KE-UG-001",
        "origin": "Nairobi",
        "destination": "Kampala", 
        "country_origin": "Kenya",
        "country_destination": "Uganda",
        "duration_hours": 8,
        "base_price": 3500,
        "currency": "KES"
    },
    {
        "route_id": "RW-TZ-001",
        "origin": "Kigali",
        "destination": "Dar es Salaam",
        "country_origin": "Rwanda", 
        "country_destination": "Tanzania",
        "duration_hours": 15,
        "base_price": 35000,
        "currency": "RWF"
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
    # Generate mock bus schedules
    buses = []
    departure_times = ["06:00", "10:00", "14:00", "18:00", "22:00"]
    
    for i, departure in enumerate(departure_times):
        # Calculate arrival time
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
                "price": route["base_price"] * (1.5 if bus_type == "premium" else 1.0)
            })
    
    return {"buses": buses}

def serialize_mongo_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    # Create a copy to avoid modifying the original
    doc_copy = dict(doc)
    if "_id" in doc_copy:
        del doc_copy["_id"]  # Remove MongoDB ObjectId
    return doc_copy

@app.post("/api/users")
async def create_user(user: User):
    """Create a new user"""
    user_id = str(uuid.uuid4())
    
    # Check if user already exists
    existing_user = db.users.find_one({"email": user.email})
    if existing_user:
        return {"user": serialize_mongo_doc(existing_user)}
    
    # Create user data manually to avoid Pydantic serialization issues
    user_data = {
        "user_id": user_id,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "preferred_language": user.preferred_language,
        "created_at": datetime.now().isoformat()
    }
    
    db.users.insert_one(user_data.copy())  # Use copy to avoid modifying original
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
    booking.booking_id = str(uuid.uuid4())
    booking.booking_date = datetime.now().isoformat()
    
    # Generate QR code
    qr_data = {
        "booking_id": booking.booking_id,
        "bus_id": booking.bus_id,
        "seats": booking.seat_numbers,
        "travel_date": booking.travel_date
    }
    booking.qr_code = generate_qr_code(json.dumps(qr_data))
    
    booking_data = booking.dict()
    
    # Update seat availability (in real implementation, this would be atomic)
    # For now, we'll store the booking and rely on frontend to manage seat state
    
    db.bookings.insert_one(booking_data)
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

@app.post("/api/payment/mock")
async def mock_payment(payment_data: dict):
    """Mock payment processing"""
    # Simulate payment processing
    booking_id = payment_data.get("booking_id")
    payment_method = payment_data.get("payment_method", "m-pesa")
    amount = payment_data.get("amount")
    
    # Update booking payment status
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)