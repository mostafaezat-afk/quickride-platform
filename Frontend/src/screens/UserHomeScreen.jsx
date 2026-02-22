import { useContext, useEffect, useRef, useState } from "react";
import { useUser } from "../contexts/UserContext";
import {
  Button,
  RideDetails,
  Sidebar,
  LiveMap,
} from "../components";
import axios from "axios";
import { SocketDataContext } from "../contexts/SocketContext";
import Console from "../utils/console";
import { useAlert } from "../hooks/useAlert";
import { Alert } from "../components";

const vehicleTypes = [
  { id: "tuktuk", name: "توكتوك", icon: "🛺", desc: "3 ركاب" },
  { id: "bike", name: "موتوسيكل", icon: "🏍️", desc: "راكب واحد" },
  { id: "torsicle", name: "تورسيكل", icon: "🛵", desc: "2 ركاب" },
  { id: "delivery", name: "ديليفري", icon: "📦", desc: "توصيل طلبات" },
];

const safeJSONParse = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item && item !== "undefined" ? JSON.parse(item) : fallback;
  } catch (error) {
    return fallback;
  }
};

function UserHomeScreen() {
  const token = localStorage.getItem("token");
  const { socket } = useContext(SocketDataContext);
  const { user } = useUser();
  const [messages, setMessages] = useState(
    safeJSONParse("messages", [])
  );
  const [loading, setLoading] = useState(false);
  const [rideCreated, setRideCreated] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);

  const { alert, showAlert, hideAlert } = useAlert();

  // Ride details
  const [pickupLocation, setPickupLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("tuktuk");
  const [fare, setFare] = useState({});
  const [activeCaptains, setActiveCaptains] = useState([]);
  const [confirmedRideData, setConfirmedRideData] = useState(null);
  const rideTimeout = useRef(null);

  // Panels
  const [showBookingPanel, setShowBookingPanel] = useState(true);
  const [showRideDetailsPanel, setShowRideDetailsPanel] = useState(false);

  // Auto-detect location via GPS
  const detectMyLocation = () => {
    if (!navigator.geolocation) {
      Console.log("Geolocation not supported");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        Console.log("GPS:", latitude, longitude);
        setUserCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
          );
          const data = await res.json();
          Console.log("Reverse geocode:", data);
          const addr = data.address || {};
          const parts = [
            addr.road || addr.pedestrian || addr.neighbourhood,
            addr.suburb || addr.city_district,
            addr.city || addr.town || addr.village,
          ].filter(Boolean);
          const locationName = parts.join("، ") || data.display_name || `${latitude}, ${longitude}`;
          setPickupLocation(locationName);
        } catch (err) {
          Console.log("Reverse geocode error:", err);
          setPickupLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setGpsLoading(false);
      },
      (error) => {
        Console.log("GPS error:", error);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Auto-detect on first load
  useEffect(() => {
    if (!pickupLocation) {
      detectMyLocation();
    }
  }, []);

  const searchForRide = async () => {
    if (!pickupLocation.trim() || !destinationLocation.trim()) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/ride/get-fare?pickup=${encodeURIComponent(pickupLocation)}&destination=${encodeURIComponent(destinationLocation)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Console.log(response);
      setFare(response.data.fare || {});
      setShowBookingPanel(false);
      setShowRideDetailsPanel(true);
      setLoading(false);
    } catch (error) {
      Console.log(error);
      setLoading(false);
    }
  };

  const createRide = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/ride/create`,
        {
          pickup: pickupLocation,
          destination: destinationLocation,
          vehicleType: selectedVehicle,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Console.log(response);
      const rideData = {
        pickup: pickupLocation,
        destination: destinationLocation,
        vehicleType: selectedVehicle,
        fare: fare,
        confirmedRideData: confirmedRideData,
        _id: response.data._id,
      };
      localStorage.setItem("rideDetails", JSON.stringify(rideData));
      setLoading(false);
      setRideCreated(true);

      rideTimeout.current = setTimeout(() => {
        cancelRide();
      }, import.meta.env.VITE_RIDE_TIMEOUT || 90000);

    } catch (error) {
      Console.log(error);
      setLoading(false);
      showAlert("تنبيه", error.response?.data?.message || "حدث خطأ أثناء حجز الرحلة", "failure");
    }
  };

  const cancelRide = async () => {
    const rideDetails = JSON.parse(localStorage.getItem("rideDetails"));
    try {
      setLoading(true);
      await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/ride/cancel?rideId=${rideDetails?._id || rideDetails?.confirmedRideData?._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLoading(false);
      setShowRideDetailsPanel(false);
      setShowBookingPanel(true);
      setDefaults();
      localStorage.removeItem("rideDetails");
      localStorage.removeItem("panelDetails");
      localStorage.removeItem("messages");
      localStorage.removeItem("showPanel");
      localStorage.removeItem("showBtn");
    } catch (error) {
      Console.log(error);
      setLoading(false);
      showAlert("تنبيه", "حدث خطأ أثناء إلغاء الرحلة", "failure");
    }
  };

  const setDefaults = () => {
    setDestinationLocation("");
    setSelectedVehicle("tuktuk");
    setFare({});
    setConfirmedRideData(null);
    setRideCreated(false);
    detectMyLocation();
  };

  // Socket Events
  useEffect(() => {
    if (user?._id) {
      socket.emit("join", {
        userId: user._id,
        userType: "user",
      });
    }

    socket.on("ride-confirmed", (data) => {
      Console.log("Clearing Timeout", rideTimeout);
      clearTimeout(rideTimeout.current);
      Console.log("Ride Confirmed");
      setConfirmedRideData(data);
    });

    socket.on("ride-started", (data) => {
      Console.log("Ride started");
    });

    socket.on("ride-ended", (data) => {
      Console.log("Ride Ended");
      setShowRideDetailsPanel(false);
      setShowBookingPanel(true);
      setDefaults();
      localStorage.removeItem("rideDetails");
      localStorage.removeItem("panelDetails");
    });
  }, [user]);

  // Radar: Request nearby captains every 5 seconds
  useEffect(() => {
    let interval;
    if (user?._id && userCoords?.lat && userCoords?.lng) {
      // Fetch immediately once
      socket.emit("update-location-user", {
        userId: user._id,
        location: { ltd: userCoords.lat, lng: userCoords.lng },
        vehicleType: null, // show all types on the map
      });

      // Then fetch every 5 seconds
      interval = setInterval(() => {
        socket.emit("update-location-user", {
          userId: user._id,
          location: { ltd: userCoords.lat, lng: userCoords.lng },
          vehicleType: null,
        });
      }, 5000);
    }

    socket.on("nearby-captains", (captains) => {
      setActiveCaptains(captains || []);
    });

    return () => {
      if (interval) clearInterval(interval);
      socket.off("nearby-captains");
    };
  }, [user, userCoords, socket]);

  // Get ride details from localStorage
  useEffect(() => {
    const ride = safeJSONParse("rideDetails", null);
    const panels = safeJSONParse("panelDetails", null);

    if (ride) {
      setPickupLocation(ride.pickup || "");
      setDestinationLocation(ride.destination || "");
      setSelectedVehicle(ride.vehicleType || "tuktuk");
      setFare(ride.fare || {});
      setConfirmedRideData(ride.confirmedRideData);
    }

    if (panels) {
      setShowBookingPanel(panels.showBookingPanel ?? true);
      setShowRideDetailsPanel(panels.showRideDetailsPanel ?? false);
    }
  }, []);

  // Store Ride Details
  useEffect(() => {
    const rideData = {
      pickup: pickupLocation,
      destination: destinationLocation,
      vehicleType: selectedVehicle,
      fare: fare,
      confirmedRideData: confirmedRideData,
    };
    localStorage.setItem("rideDetails", JSON.stringify(rideData));
  }, [pickupLocation, destinationLocation, selectedVehicle, fare, confirmedRideData]);

  // Store panel information
  useEffect(() => {
    const panelDetails = {
      showBookingPanel,
      showRideDetailsPanel,
    };
    localStorage.setItem("panelDetails", JSON.stringify(panelDetails));
  }, [showBookingPanel, showRideDetailsPanel]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (confirmedRideData?._id) {
      socket.emit("join-room", confirmedRideData._id);
    }

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, { msg, by: "other" }]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [confirmedRideData]);

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      <Alert
        heading={alert.heading}
        text={alert.text}
        isVisible={alert.isVisible}
        onClose={hideAlert}
        type={alert.type}
      />

      {/* Full-screen Interactive React Leaflet Map */}
      <div className="absolute inset-0 w-full h-full z-0">
        <LiveMap
          pickupLocation={userCoords}
          destinationLocation={null}
          activeCaptains={activeCaptains}
        />
      </div>

      {gpsLoading && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg z-20 font-bold text-green-600 flex items-center gap-2">
          <span>⏳</span> جاري تحديد موقعك بدقة...
        </div>
      )}

      {/* Sidebar */}
      <div className="relative z-20">
        <Sidebar />
      </div>

      {/* SOS Button (only visible during an active ride) */}
      {confirmedRideData && (
        <button
          onClick={() => alert("تم إرسال بلاغ الطوارئ (SOS) وجاري تحديد موقعك للإغاثة فوراً!")}
          className="absolute top-20 right-4 z-20 bg-red-600 text-white font-bold px-4 py-2.5 rounded-full shadow-lg hover:bg-red-700 hover:scale-105 transition-all flex items-center gap-2 border-2 border-white ring-4 ring-red-500/30 animate-pulse"
        >
          <span className="text-xl">🚨</span> SOS
        </button>
      )}

      {/* Booking Panel - Bottom Sheet */}
      {showBookingPanel && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-xl rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-5 pb-6 border-t border-white/40 transition-transform duration-300 transform translate-y-0">
          {/* Drag Handle Indicator */}
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-5 opacity-60"></div>

          <h1 className="text-xl font-bold mb-4 text-gray-800">ابحث عن رحلة 🛺</h1>

          {/* Location Inputs */}
          <div className="flex items-center relative w-full mb-3">
            <div className="h-3/5 w-[3px] flex flex-col items-center justify-between bg-black rounded-full absolute mx-4" style={{ top: '18%' }}>
              <div className="w-2 h-2 rounded-full border-[3px] bg-green-500 border-green-500"></div>
              <div className="w-2 h-2 rounded-sm border-[3px] bg-red-500 border-red-500"></div>
            </div>
            <div className="w-full">
              <div className="relative mb-2">
                <input
                  placeholder={gpsLoading ? "📍 جاري تحديد موقعك..." : "📍 من أين؟ (موقعك الحالي)"}
                  className="w-full bg-green-50 border border-green-200 pr-10 pl-12 py-2.5 rounded-lg text-sm"
                  value={gpsLoading ? "📍 جاري تحديد موقعك..." : pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  autoComplete="off"
                  disabled={gpsLoading}
                />
                <button
                  type="button"
                  onClick={detectMyLocation}
                  disabled={gpsLoading}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-green-500 text-white rounded-md px-2 py-1 text-xs font-bold hover:bg-green-600 transition-colors"
                  title="تحديد موقعي"
                >
                  {gpsLoading ? "⏳" : "📍"}
                </button>
              </div>
              <input
                placeholder="📌 إلى أين؟ (اكتب اسم المنطقة)"
                className="w-full bg-red-50 border border-red-200 pr-10 pl-4 py-2.5 rounded-lg text-sm"
                value={destinationLocation}
                onChange={(e) => setDestinationLocation(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Vehicle Type Selection */}
          <p className="text-sm font-semibold text-gray-600 mb-2">اختر نوع المركبة:</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {vehicleTypes.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVehicle(v.id)}
                className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${selectedVehicle === v.id
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
              >
                <span className="text-2xl mb-0.5">{v.icon}</span>
                <span className="text-xs font-bold leading-tight">{v.name}</span>
                <span className={`text-[10px] leading-tight ${selectedVehicle === v.id ? "text-gray-300" : "text-gray-400"}`}>{v.desc}</span>
              </button>
            ))}
          </div>

          {/* Search Button */}
          {pickupLocation.trim().length > 2 && destinationLocation.trim().length > 2 ? (
            <Button
              title={"اطلب رحلة"}
              loading={loading}
              fun={searchForRide}
            />
          ) : (
            <div className="py-3 text-center text-sm text-gray-400 bg-gray-100 rounded-lg font-semibold">
              اكتب الوجهة لطلب رحلة
            </div>
          )}
        </div>
      )}

      {/* Ride Details Panel */}
      <RideDetails
        pickupLocation={pickupLocation}
        destinationLocation={destinationLocation}
        selectedVehicle={selectedVehicle}
        fare={fare}
        showPanel={showRideDetailsPanel}
        setShowPanel={setShowRideDetailsPanel}
        showPreviousPanel={setShowBookingPanel}
        createRide={createRide}
        cancelRide={cancelRide}
        loading={loading}
        rideCreated={rideCreated}
        confirmedRideData={confirmedRideData}
      />
    </div>
  );
}

export default UserHomeScreen;
