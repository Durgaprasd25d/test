# Uber-Like Driver Live Tracking System

A production-ready real-time driver tracking system built with **React Native + Expo** (frontend) and **Node.js + Socket.IO** (backend), featuring smooth animations, WebSocket communication, and robust fallback mechanisms.

## 🎯 Features

### Driver App
- ✅ High-accuracy GPS tracking
- ✅ Background location updates  
- ✅ Real-time location broadcasting via WebSocket
- ✅ Distance-based throttling (battery optimized)
- ✅ Connection status monitoring
- ✅ Live speed & accuracy display

### Customer App
- ✅ Real-time driver tracking on Google Maps
- ✅ Smooth marker animation (no jumping/flickering)
- ✅ Automatic bearing rotation based on movement
- ✅ Camera auto-follow with toggle
- ✅ GPS noise filtering
- ✅ WebSocket with polling fallback
- ✅ Connection status indicators

### Backend
- ✅ REST API for location updates
- ✅ Socket.IO real-time broadcasting
- ✅ In-memory location storage (Redis-ready)
- ✅ Stale location detection
- ✅ Automatic cleanup
- ✅ Comprehensive error handling

---

## 📁 Project Structure

```
Realtime Track/
├── backend/                    # Node.js + Express + Socket.IO server
│   ├── server.js              # Main server file
│   ├── routes/
│   │   └── location.js        # REST API endpoints
│   ├── services/
│   │   └── locationStore.js   # Location storage service
│   ├── sockets/
│   │   └── locationSocket.js  # WebSocket event handlers
│   ├── package.json
│   ├── .env.example           # Environment variables template
│   └── .gitignore
│
└── mobile-app/                 # React Native + Expo app
    ├── App.js                  # Main app with navigation
    ├── src/
    │   ├── screens/
    │   │   ├── HomeScreen.js           # Role selection
    │   │   ├── DriverScreen.js         # Driver tracking UI
    │   │   └── CustomerScreen.js       # Customer map view
    │   ├── components/
    │   │   └── AnimatedMarker.js       # Smooth marker animation
    │   ├── services/
    │   │   ├── driverLocationService.js    # GPS tracking
    │   │   ├── driverSocketService.js      # Driver WebSocket
    │   │   ├── customerSocketService.js    # Customer WebSocket
    │   │   └── pollingService.js           # Fallback polling
    │   ├── store/
    │   │   └── useLocationStore.js     # Zustand state management
    │   ├── utils/
    │   │   ├── mapUtils.js             # Map calculations
    │   │   └── locationInterpolation.js # Smooth animations
    │   ├── constants/
    │   │   └── config.js               # App configuration
    │   └── assets/
    │       └── car-icon.png            # Custom marker icon
    ├── package.json
    ├── app.json                # Expo configuration
    ├── .env.example            # Environment variables template
    └── .gitignore
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **Google Maps API Key** (get from [Google Cloud Console](https://console.cloud.google.com/))
- **Android Studio** / **Xcode** (for simulators) or **Expo Go** app

---

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd "Realtime Track/backend"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file** (optional - defaults work fine):
   ```env
   PORT=3000
   NODE_ENV=development
   LOCATION_STALE_TIMEOUT=30000
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

   The server will start on `http://localhost:3000`

---

### Mobile App Setup

1. **Navigate to mobile app directory:**
   ```bash
   cd "Realtime Track/mobile-app"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

### 3. Mobile App Environment Configuration

Create a `.env` file in the `mobile-app/` directory:

```env
# Your computer's local network IP (e.g. http://192.168.1.50:3000)
# Use EXPO_PUBLIC_ prefix for Expo SDK 49+
EXPO_PUBLIC_BACKEND_URL=http://<YOUR_IP>:3000

# Your Google Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBnA5Sw2GQC-Jt0rjH40qaGOx3vkALKWKA
```

   > **Finding your IP:**
   > - Windows: `ipconfig` (look for IPv4 Address)
   > - Mac/Linux: `ifconfig` or `ip addr`
   > - Don't use `localhost` - use your actual local network IP!

5. **Update `app.json` with Google Maps API Key:**
   - Open `app.json`
   - Replace `YOUR_GOOGLE_MAPS_API_KEY` in both `ios.config.googleMapsApiKey` and `android.config.googleMaps.apiKey`

6. **Start Expo:**
   ```bash
   npx expo start
   ```

7. **Run the app:**
   - **iOS Simulator:** Press `i`
   - **Android Emulator:** Press `a`
   - **Physical Device:** Scan QR code with Expo Go app

---

## 📱 Usage

### Testing the System

1. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start Mobile App:**
   ```bash
   cd mobile-app
   npx expo start
   ```

3. **Driver Mode:**
   - Enter a Ride ID (e.g., `ride123`)
   - Select **Driver** role
   - Grant location permissions
   - Press **Start Tracking**
   - Move around (or use simulator location simulation)

4. **Customer Mode:**
   - Use the **same Ride ID** (`ride123`)
   - Select **Customer** role
   - Watch the driver marker move in real-time on the map
   - Toggle camera follow with the compass button

### Testing with Simulator

- **iOS Simulator:** Features → Location → Custom Location or Freeway Drive
- **Android Emulator:** Extended Controls (⋮) → Location → Set location or play route

---

## 🔧 Configuration

### Backend Configuration (`backend/.env`)
- `PORT`: Server port (default: 3000)
- `LOCATION_STALE_TIMEOUT`: Max age for location data (default: 30000ms)

### Mobile App Configuration (`mobile-app/src/constants/config.js`)
- `DRIVER_LOCATION_INTERVAL`: Location update frequency (2000ms)
- `DRIVER_DISTANCE_FILTER`: Minimum distance between updates (10m)
- `POLLING_INTERVAL`: Fallback polling frequency (5000ms)
- `MARKER_ANIMATION_DURATION`: Marker animation speed (1000ms)
- `GPS_NOISE_THRESHOLD`: Filter small movements (5m)

---

## 🛠️ API Endpoints

### REST API

#### POST `/api/driver/location`
Send driver location update.

**Request:**
```json
{
  "rideId": "ride123",
  "lat": 37.7749,
  "lng": -122.4194,
  "bearing": 45,
  "speed": 15.5,
  "timestamp": 1234567890
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully"
}
```

#### GET `/api/driver/location/:rideId`
Get latest driver location.

**Response:**
```json
{
  "success": true,
  "data": {
    "lat": 37.7749,
    "lng": -122.4194,
    "bearing": 45,
    "speed": 15.5,
    "timestamp": 1234567890,
    "serverTimestamp": 1234567891
  }
}
```

### WebSocket Events

#### Driver Events
- `driver:join` - Join ride room
- `driver:location:update` - Send location
- `driver:joined` - Join confirmation
- `driver:location:ack` - Location acknowledged

#### Customer Events
- `customer:join` - Join ride room
- `customer:location:update` - Receive location updates
- `customer:joined` - Join confirmation
- `customer:request:location` - Request latest location

---

## 🐛 Troubleshooting

### Backend Issues

**Server won't start:**
- Check if port 3000 is already in use
- Try changing `PORT` in `.env`
- Run: `lsof -i :3000` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows)

### Mobile App Issues

**Map not showing:**
- Verify Google Maps API Key is correct
- Enable Maps SDK for Android/iOS in Google Cloud Console
- Check API key restrictions

**No location updates:**
- Verify `BACKEND_URL` uses your computer's IP (not localhost)
- Ensure backend server is running
- Check firewall settings
- Both devices must be on same network

**Location permission denied:**
- Manually grant permissions in device settings
- Restart the app after granting permissions

**Marker not moving smoothly:**
- Check GPS signal strength
- Increase `GPS_NOISE_THRESHOLD` if too sensitive
- Verify location updates are being received (check backend logs)

---

## 🎨 Customization

### Change Marker Icon
Replace `mobile-app/src/assets/car-icon.png` with your custom icon (recommended size: 40x40px).

### Adjust Animation Speed
Edit `mobile-app/src/constants/config.js`:
```javascript
MARKER_ANIMATION_DURATION: 1500, // Slower (1.5 seconds)
CAMERA_ANIMATION_DURATION: 300,  // Faster (0.3 seconds)
```

### Enable Redis (Production)
1. Install Redis: `npm install ioredis`
2. Uncomment Redis code in `backend/services/locationStore.js`
3. Add `REDIS_URL=redis://localhost:6379` to `.env`

---

## 📦 Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Deploy to hosting service (Heroku, AWS, DigitalOcean, etc.)
3. Use Redis for scalability
4. Set up SSL/TLS
5. Configure CORS for your mobile app domain

### Mobile App
1. Update `BACKEND_URL` to production server
2. Build for iOS/Android:
   ```bash
   expo build:ios
   expo build:android
   ```
3. Submit to App Store / Play Store

---

## 📄 License

MIT License - Feel free to use for personal or commercial projects.

---

## 🙏 Credits

Built with:
- **React Native + Expo** - Mobile framework
- **Socket.IO** - Real-time WebSocket communication
- **Google Maps** - Map rendering
- **Express** - Backend API
- **Zustand** - State management

---

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review backend/mobile app logs
3. Ensure all dependencies are installed
4. Verify network connectivity between devices

---

**Enjoy your Uber-like tracking system! 🚗💨**
