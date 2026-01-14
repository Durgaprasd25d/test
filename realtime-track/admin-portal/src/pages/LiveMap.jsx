import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline, Circle } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import axios from 'axios';
import { MapPin, User, Briefcase, Navigation, Clock, Target, Radio, Sliders, ChevronRight } from 'lucide-react';

const mapContainerStyle = {
    width: '100%',
    height: 'calc(100vh - 180px)',
    borderRadius: '16px',
};

const defaultCenter = {
    lat: 13.0827, // Chennai
    lng: 80.2707,
};

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    styles: [
        { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
        { "featureType": "transit", "stylers": [{ "visibility": "off" }] }
    ]
};

// Helper to calculate distance between two coordinates in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export default function LiveMap() {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyBnA5Sw2GQC-Jt0rjH40qaGOx3vkALKWKA"
    });

    const [allJobs, setAllJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [adminLocation, setAdminLocation] = useState(null);
    const [scannerActive, setScannerActive] = useState(false);
    const [scannerRadius, setScannerRadius] = useState(5000); // meters
    const [pulseOpacity, setPulseOpacity] = useState(0.4);

    const socketRef = useRef(null);
    const mapRef = useRef(null);

    // Scanner animation effect
    useEffect(() => {
        let interval;
        if (scannerActive) {
            interval = setInterval(() => {
                setPulseOpacity(prev => prev === 0.4 ? 0.1 : 0.4);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [scannerActive]);

    useEffect(() => {
        fetchActiveJobs();

        socketRef.current = io('http://127.0.0.1:4000', { transports: ['websocket'] });
        socketRef.current.on('connect', () => {
            socketRef.current.emit('identify', { role: 'admin' });
        });

        socketRef.current.on('admin:location:update', (data) => {
            const { rideId, location } = data;
            setAllJobs(prev => prev.map(job =>
                job.rideId === rideId ? { ...job, currentLocation: location } : job
            ));
        });

        return () => socketRef.current?.disconnect();
    }, []);

    // Filter logic
    useEffect(() => {
        if (!scannerActive || !adminLocation) {
            setFilteredJobs(allJobs);
            return;
        }

        const filtered = allJobs.filter(job => {
            const loc = job.currentLocation || job.pickup;
            if (!loc) return false;
            const dist = calculateDistance(
                adminLocation.lat, adminLocation.lng,
                loc.lat, loc.lng
            );
            return (dist * 1000) <= scannerRadius;
        });
        setFilteredJobs(filtered);
    }, [allJobs, scannerActive, adminLocation, scannerRadius]);

    const fetchActiveJobs = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:4000/api/admin/active-jobs');
            if (response.data.success) {
                setAllJobs(response.data.jobs);
            }
        } catch (error) { console.error(error); }
    };

    const findMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setAdminLocation(pos);
                setScannerActive(true);
                mapRef.current?.panTo(pos);
                mapRef.current?.setZoom(13);
            }, () => {
                alert("Error: The Geolocation service failed.");
            });
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Radio className="text-rose-500 animate-pulse" size={24} />
                        Fleet Scanner
                    </h2>
                    <p className="text-slate-500">Real-time geospatial monitoring & geo-fencing</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={findMe}
                        className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 text-slate-700 font-semibold transition-all"
                    >
                        <Target size={18} className="text-blue-600" />
                        Center on Me
                    </button>

                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                        <span className="text-sm font-bold text-slate-600">Scanner</span>
                        <button
                            onClick={() => setScannerActive(!scannerActive)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${scannerActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${scannerActive ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {scannerActive && (
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 min-w-48">
                            <Sliders size={16} className="text-slate-400" />
                            <input
                                type="range" min="1000" max="20000" step="500"
                                value={scannerRadius}
                                onChange={(e) => setScannerRadius(parseInt(e.target.value))}
                                className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <span className="text-xs font-bold text-blue-600 w-12">{(scannerRadius / 1000).toFixed(1)}km</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[650px]">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Navigation size={18} className="text-blue-600" />
                            {scannerActive ? 'In Range' : 'All Jobs'}
                        </h3>
                        <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-lg font-bold">
                            {filteredJobs.length} FOUND
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredJobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-60 text-center p-6 text-gray-400">
                                <Radio size={48} className="mb-4 opacity-10" />
                                <p className="text-sm font-medium">No technicians detected in this zone</p>
                                <p className="text-xs mt-1">Try expanding the scanner radius</p>
                            </div>
                        ) : (
                            filteredJobs.map((job) => (
                                <button
                                    key={job.rideId}
                                    onClick={() => setSelectedJob(job)}
                                    className={`w-full text-left p-4 rounded-xl transition-all border group ${selectedJob?.rideId === job.rideId
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'border-transparent hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-bold text-slate-800 text-sm truncate">{job.serviceType.toUpperCase()}</p>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                        <span className={`w-2 h-2 rounded-full ${job.status === 'IN_PROGRESS' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                        <span className="font-medium">{job.status}</span>
                                        <span className="text-gray-300">•</span>
                                        <span className="font-mono text-[9px]">#{job.rideId.slice(-6)}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={adminLocation || defaultCenter}
                            zoom={12}
                            options={mapOptions}
                            onLoad={map => mapRef.current = map}
                        >
                            {/* Geo-Fence Circle */}
                            {scannerActive && adminLocation && (
                                <>
                                    <Circle
                                        center={adminLocation}
                                        radius={scannerRadius}
                                        options={{
                                            fillColor: '#3B82F6',
                                            fillOpacity: 0.1,
                                            strokeColor: '#3B82F6',
                                            strokeOpacity: 0.3,
                                            strokeWeight: 1,
                                            clickable: false,
                                        }}
                                    />
                                    <Circle
                                        center={adminLocation}
                                        radius={scannerRadius * 0.95}
                                        options={{
                                            fillColor: '#3B82F6',
                                            fillOpacity: pulseOpacity,
                                            strokeWeight: 0,
                                            clickable: false,
                                        }}
                                    />
                                    <Marker
                                        position={adminLocation}
                                        icon={{
                                            path: window.google.maps.SymbolPath.CIRCLE,
                                            scale: 8,
                                            fillColor: "#3B82F6",
                                            fillOpacity: 1,
                                            strokeColor: "#FFFFFF",
                                            strokeWeight: 3,
                                        }}
                                    />
                                </>
                            )}

                            {filteredJobs.map((job) => (
                                <React.Fragment key={job.rideId}>
                                    {job.currentLocation && (
                                        <Marker
                                            position={{ lat: job.currentLocation.lat, lng: job.currentLocation.lng }}
                                            onClick={() => setSelectedJob(job)}
                                            icon={{
                                                url: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
                                                scaledSize: new window.google.maps.Size(40, 40)
                                            }}
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </GoogleMap>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">Loading Radar...</div>
                    )}
                </div>
            </div>
        </div>
    );
}
