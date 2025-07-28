import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any, Union
from typing import List
from fastapi import FastAPI, HTTPException, Depends, Request
from starlette.responses import JSONResponse  # Change this import
from fastapi.middleware.cors import CORSMiddleware
from fastapi_utils.tasks import repeat_every
from supabase import create_client, Client
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from asyncio import TimeoutError
import async_timeout
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime, timedelta
import uuid
import qrcode
import base64
from io import BytesIO
import logging

# Environment configuration
load_dotenv()
# Add after API_VERSION definition
API_VERSION = "1.2.0"
VERSION = API_VERSION 
ENV = os.getenv("ENV", "development")
DEBUG = ENV != "production"
BUILD_DATE = "2024-07-28"
#rate limiter
limiter = Limiter(key_func=get_remote_address)


# Currency conversion rates (as of typical 2024 rates)
CURRENCY_RATES = {
    "USD": 1.0,
    "KES": 157.25,  # 1 USD = 157.25 KES
    "RWF": 1225.50,  # 1 USD = 1225.50 RWF
    "UGX": 3800.75,  # 1 USD = 3800.75 UGX
    "TZS": 2500.30,  # 1 USD = 2500.30 TZS
}

CURRENCY_SYMBOLS = {
    "USD": "$",
    "KES": "Ksh",
    "RWF": "RF",
    "UGX": "USh",
    "TZS": "TSh"
}

# Supabase setup
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Check environment variables.")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    raise ConnectionError(f"Failed to connect to Supabase: {str(e)}")
app = FastAPI(
    title="Trinity Bus Booking API",
    version=API_VERSION,
    debug=DEBUG
)
@app.on_event("startup")
@repeat_every(seconds=60 * 60 * 24)
async def update_currency_rates():
    """Update currency rates daily"""
    try:
        for currency in CURRENCY_RATES:
            if currency != "USD":
                pass  # Here you would implement the logic to fetch and update currency rates
        # Add logic to update CURRENCY_RATES
        logger.info("Currency rates updated successfully")
    except Exception as e:
        logger.error(f"Failed to update currency rates: {e}")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    return response
# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for handling timeouts
class TimeoutMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            async with async_timeout.timeout(30):  # 30 second timeout
                response = await call_next(request)
                return response
        except TimeoutError:
            return JSONResponse(
                status_code=504,
                content={"detail": "Request timeout"}
            )

app.add_middleware(TimeoutMiddleware)
# Pydantic models
class User(BaseModel):
    user_id: Optional[str] = None
    email: str
    full_name: str
    phone: str
    preferred_language: str = "en"

def convert_price(amount: float, from_currency: str, to_currency: str) -> float:
    """Convert price between currencies"""
    if not isinstance(amount, (int, float)):
        raise ValueError("Amount must be a number")
    
    if amount < 0:
        raise ValueError("Amount cannot be negative")
    try:
        if from_currency not in CURRENCY_RATES or to_currency not in CURRENCY_RATES:
            raise ValueError(f"Unsupported currency: {from_currency} or {to_currency}")
            
        if from_currency == to_currency:
            return amount
        
        usd_amount = amount / CURRENCY_RATES[from_currency] if from_currency != "USD" else amount
        final_amount = usd_amount * CURRENCY_RATES[to_currency]
        
        return round(final_amount, 2)
    except Exception as e:
        raise ValueError(f"Currency conversion error: {str(e)}")
class DatabaseError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=500, detail=f"Database error: {detail}")

class RouteCreate(BaseModel):
    origin: str
    destination: str
    country_origin: str
    country_destination: str
    duration_hours: int
    base_price: float
    base_currency: str = "USD"
    origin_coords: List[float]
    destination_coords: List[float]
    
    @validator('base_currency')
    def validate_currency(cls, v):
        if v not in CURRENCY_RATES:
            raise ValueError(f"Unsupported currency: {v}")
        return v
    @validator('origin_coords', 'destination_coords')
    def validate_coordinates(cls, coords):
        if len(coords) != 2:
            raise ValueError("Coordinates must be [latitude, longitude]")
        lat, lon = coords
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            raise ValueError("Invalid coordinates range")
        return coords
    

# Update the Route class
class Route(BaseModel):
    route_id: Optional[str] = None
    origin: str
    destination: str
    country_origin: str
    country_destination: str
    duration_hours: int
    base_price: float
    base_currency: str = "USD"
    prices: Dict[str, float] = {}  # Will store prices in all currencies
    origin_coords: List[float]
    destination_coords: List[float]
    waypoints: List[List[float]] = []  # Add default empty list
    available_seats: List[int] = list(range(1, 45))  # Add default seats
    created_at: Optional[str] = datetime.now().isoformat()  # Add default timestamp

    @validator('origin_coords', 'destination_coords')
    def validate_coordinates(cls, coords):
        if len(coords) != 2:
            raise ValueError("Coordinates must be [latitude, longitude]")
        lat, lon = coords
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            raise ValueError("Invalid coordinates range")
        return coords
class Bus(BaseModel):
    bus_id: Optional[str] = None
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
    status: str = "scheduled"

    @validator('current_location')
    def validate_location(cls, coords):
        if coords and len(coords) != 2:
            raise ValueError("Location coordinates must be [latitude, longitude]")
        if coords:
            lat, lon = coords
            if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                raise ValueError("Invalid coordinates range")
        return coords
    
class RouteResponse(BaseModel):
    route_id: str
    origin: str
    destination: str
    country_origin: str
    country_destination: str
    duration_hours: int
    base_price: float
    prices: Dict[str, float]
    formatted_prices: Dict[str, str]
    origin_coords: List[float]
    destination_coords: List[float]
    available_seats: List[int]
    waypoints: List[List[float]] = []

class BookingResponse(BaseModel):
    booking_id: str
    user_id: str
    route_id: str
    travel_date: str
    seat_number: int
    status: str
    qr_code: Optional[str]
    route: RouteResponse
    created_at: str

class Booking(BaseModel):
    booking_id: Optional[str] = None
    user_id: str
    route_id: str
    travel_date: str
    seat_number: int
    status: str = "pending"
    qr_code: Optional[str] = None


class SeatUpdate(BaseModel):
    route_id: str
    seat_number: int
    status: str

# API Routes
@app.post("/users/", response_model=User)
async def create_user(user: User) -> User:
    try:
        data = user.dict()
        if not data.get('user_id'):
            data['user_id'] = str(uuid.uuid4())
        
        response = supabase.table('users').insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Update the get_routes function
@app.get("/routes/", response_model=List[RouteResponse])
@limiter.limit("100/minute")
async def get_routes(request: Request, currency: str = "USD") -> List[RouteResponse]:
    """
    Get all available routes with prices in requested currency.
    
    Args:
        currency (str, optional): Currency code. Defaults to "USD".
    
    Returns:
        List[RouteResponse]: List of routes with prices
    """
    try:
        response = supabase.table('routes').select("*").execute()
        routes = response.data
        
        # Add prices in all currencies for each route
        for route in routes:
            base_price = route['base_price']
            base_currency = route.get('base_currency', 'USD')
            route['prices'] = {
                curr: convert_price(base_price, base_currency, curr)
                for curr in CURRENCY_RATES.keys()
            }
            
        return routes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/currencies/")
async def get_currencies() -> Dict[str, Union[List[str], Dict[str, str], Dict[str, float]]]:
    return {
        "currencies": list(CURRENCY_RATES.keys()),
        "symbols": CURRENCY_SYMBOLS,
        "rates": CURRENCY_RATES
    }

@app.post("/bookings/", response_model=BookingResponse)
@limiter.limit("30/minute")
async def create_booking(request: Request, booking: Booking) -> BookingResponse:
    """
    Create a new booking with the following steps:
    1. Validate seat availability
    2. Generate QR code for ticket
    3. Update available seats
    4. Store booking in database
    
    Args:
        booking (Booking): The booking information
        
    Returns:
        Dict[str, Any]: The created booking with QR code
    """
    try:
        data = booking.dict()
        if not data.get('booking_id'):
            data['booking_id'] = str(uuid.uuid4())
        data['created_at'] = datetime.now().isoformat()
        
        # Check seat availability
        route_response = supabase.table('routes')\
            .select("available_seats")\
            .eq('route_id', booking.route_id)\
            .execute()
            
        if not route_response.data:
            raise HTTPException(
                status_code=404, 
                detail=f"Route {booking.route_id} not found"
            )
            
        available_seats = route_response.data[0]['available_seats']
        if booking.seat_number not in available_seats:
            raise HTTPException(
                status_code=400, 
                detail=f"Seat {booking.seat_number} is not available for this route"
            )
            
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr_data = {
            'booking_id': data['booking_id'],
            'user_id': booking.user_id,
            'route_id': booking.route_id,
            'seat_number': booking.seat_number,
            'travel_date': booking.travel_date
        }
        qr.add_data(str(qr_data))
        qr.make(fit=True)
        
        # Convert QR code to base64 string
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        qr_code = base64.b64encode(buffered.getvalue()).decode()
        
        # Add QR code to booking data
        data['qr_code'] = qr_code
            
        # Create booking
        response = supabase.table('bookings').insert(data).execute()
        
        # Update available seats
        available_seats.remove(booking.seat_number)
        supabase.table('routes')\
            .update({'available_seats': available_seats})\
            .eq('route_id', booking.route_id)\
            .execute()
            
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
@app.post("/init-routes/")
async def initialize_routes() -> Dict[str, Any]:
    try:
        existing = supabase.table('routes').select("route_id").execute()
        if existing.data:
            raise HTTPException(
                status_code=400,
                detail="Routes are already initialized"
            )
        default_routes = [
            {
                "origin": "Nairobi",
                "destination": "Kampala",
                "country_origin": "Kenya",
                "country_destination": "Uganda",
                "duration_hours": 12,
                "base_price": 45.00,
                "base_currency": "USD",
                "origin_coords": [-1.2921, 36.8219],
                "destination_coords": [0.3476, 32.5825],
                "available_seats": list(range(1, 45))
            },
            {
                "origin": "Kampala",
                "destination": "Kigali",
                "country_origin": "Uganda",
                "country_destination": "Rwanda",
                "duration_hours": 8,
                "base_price": 35.00,
                "base_currency": "USD",
                "origin_coords": [0.3476, 32.5825],
                "destination_coords": [-1.9415, 30.0574],
                "available_seats": list(range(1, 45))
            },
            {
                "origin": "Nairobi",
                "destination": "Dar es Salaam",
                "country_origin": "Kenya",
                "country_destination": "Tanzania",
                "duration_hours": 12,
                "base_price": 50.00,
                "base_currency": "USD",
                "origin_coords": [-1.2921, 36.8219],
                "destination_coords": [-6.7924, 39.2083],
                "available_seats": list(range(1, 45))
            }
        ]
        
        response = supabase.table('routes').insert(default_routes).execute()
        return {"message": "Routes initialized", "count": len(response.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# Fix 1: Update get_user_bookings to include buses data
@app.get("/bookings/{user_id}",response_model=List[BookingResponse])
async def get_user_bookings(user_id: str) -> List[BookingResponse]:
    try:
        response = supabase.table('bookings')\
            .select("*, routes(*), buses(*)")\
            .eq('user_id', user_id)\
            .execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.put("/routes/{route_id}/seats", response_model=Route)
@limiter.limit("50/minute")
async def update_seat_status(request: Request, route_id: str, update: SeatUpdate) -> Route:
    try:
        route = supabase.table('routes')\
            .select("available_seats")\
            .eq('route_id', update.route_id)\
            .single()\
            .execute()
            
        if not route.data:
            raise HTTPException(status_code=404, detail="Route not found")
            
        available_seats = route.data['available_seats']
        
        if update.status == "booked" and update.seat_number in available_seats:
            available_seats.remove(update.seat_number)
        elif update.status == "available" and update.seat_number not in available_seats:
            available_seats.append(update.seat_number)
            available_seats.sort()
            
        response = supabase.table('routes')\
            .update({'available_seats': available_seats})\
            .eq('route_id', update.route_id)\
            .execute()
            
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@app.on_event("startup")
async def validate_currency_rates():
    """Validate currency rates on startup"""
    try:
        for currency, rate in CURRENCY_RATES.items():
            if not isinstance(rate, (int, float)) or rate <= 0:
                raise ValueError(f"Invalid rate for {currency}: {rate}")
    except Exception as e:
        logger.error(f"Currency rate validation failed: {e}")
        raise
# Fix 2: Enhanced health check

@app.get("/health")
async def health_check():
    try:
        test_query = supabase.table('routes').select("count").limit(1).execute()
        db_status = "connected" if test_query else "disconnected"
    except Exception as e:
        db_status = f"error: {str(e)}"
        
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "supabase_status": db_status,
        "version": VERSION,
        "build_date": BUILD_DATE,
        "environment": os.getenv("ENV", "development")
    }
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down API server")
    # Add any cleanup code here if needed
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)