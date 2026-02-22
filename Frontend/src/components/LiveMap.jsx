import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom car icons based on vehicle type
const getVehicleIcon = (type) => {
    const iconUrls = {
        car: '/car.png',
        tuktuk: '/auto.webp',
        bike: '/bike.webp',
        torsicle: '/torsicle.webp',
        delivery: '/delivery.webp',
    };

    return L.icon({
        iconUrl: iconUrls[type] || '/car.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
};

const mapStyle = {
    width: '100%',
    height: '100vh',
    zIndex: 0
};

// Component to dynamically pan the map to a new center
const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    map.setView(center, zoom);
    return null;
};

const LiveMap = ({ pickupLocation, destinationLocation, activeCaptains = [], captainLocation, captainVehicle }) => {
    const [position, setPosition] = useState([30.0444, 31.2357]); // Default Cairo
    const [zoom, setZoom] = useState(13);

    useEffect(() => {
        if (captainLocation && captainLocation.lat && captainLocation.lng) {
            setPosition([captainLocation.lat, captainLocation.lng]);
            setZoom(16);
        } else if (pickupLocation && pickupLocation.lat && pickupLocation.lng) {
            setPosition([pickupLocation.lat, pickupLocation.lng]);
            setZoom(16);
        }
    }, [pickupLocation, captainLocation]);

    return (
        <MapContainer center={position} zoom={zoom} scrollWheelZoom={true} style={mapStyle} zoomControl={false}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={position} zoom={zoom} />

            {/* Captain's Own Marker */}
            {captainLocation && captainLocation.lat && (
                <Marker
                    position={[captainLocation.lat, captainLocation.lng]}
                    icon={getVehicleIcon(captainVehicle || 'tuktuk')}
                >
                    <Popup>موقعك الحالي</Popup>
                </Marker>
            )}

            {/* User Pickup Marker */}
            {pickupLocation && pickupLocation.lat && (
                <Marker position={[pickupLocation.lat, pickupLocation.lng]}>
                    <Popup>موقع الاستلام</Popup>
                </Marker>
            )}

            {/* Destination Marker (if available) */}
            {destinationLocation && destinationLocation.lat && (
                <Marker position={[destinationLocation.lat, destinationLocation.lng]}>
                    <Popup>الوجهة</Popup>
                </Marker>
            )}

            {/* Active Captains Radar */}
            {activeCaptains.map((captain) => {
                if (!captain.location || !captain.location.coordinates || captain.location.coordinates.length < 2) return null;
                const lng = captain.location.coordinates[0];
                const lat = captain.location.coordinates[1];
                return (
                    <Marker
                        key={captain._id}
                        position={[lat, lng]}
                        icon={getVehicleIcon(captain.vehicle?.type)}
                    >
                        <Popup>{captain.fullname?.firstname} - {captain.vehicle?.type}</Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
};

export default LiveMap;
