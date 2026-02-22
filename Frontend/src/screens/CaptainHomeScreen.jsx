import { useContext, useEffect, useState } from "react";
import map from "/map.png";
import axios from "axios";
import { useCaptain } from "../contexts/CaptainContext";
import { Phone, User } from "lucide-react";
import { SocketDataContext } from "../contexts/SocketContext";
import { NewRide, Sidebar, LiveMap } from "../components";
import Console from "../utils/console";
import { useAlert } from "../hooks/useAlert";
import { Alert } from "../components";

const defaultRideData = {
  user: {
    fullname: {
      firstname: "لا",
      lastname: "يوجد",
    },
    _id: "",
    phone: "",
    rides: [],
  },
  pickup: "المكان، المدينة، المحافظة",
  destination: "المكان، المدينة، المحافظة",
  fare: 0,
  vehicle: "tuktuk",
  status: "pending",
  duration: 0,
  distance: 0,
  _id: "123456789012345678901234",
};

const safeJSONParse = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item && item !== "undefined" ? JSON.parse(item) : fallback;
  } catch (error) {
    return fallback;
  }
};

function CaptainHomeScreen() {
  const token = localStorage.getItem("token");

  const { captain } = useCaptain();
  const { socket } = useContext(SocketDataContext);
  const [loading, setLoading] = useState(false);
  const { alert, showAlert, hideAlert } = useAlert();

  const [riderLocation, setRiderLocation] = useState({
    ltd: null,
    lng: null,
  });
  const [earnings, setEarnings] = useState({
    total: 0,
    today: 0,
  });

  const [rides, setRides] = useState({
    accepted: 0,
    cancelled: 0,
    distanceTravelled: 0,
  });
  const [newRide, setNewRide] = useState(
    safeJSONParse("rideDetails", defaultRideData)
  );

  const [otp, setOtp] = useState("");
  const [messages, setMessages] = useState(
    safeJSONParse("messages", [])
  );
  const [error, setError] = useState("");

  // Panels
  const [showCaptainDetailsPanel, setShowCaptainDetailsPanel] = useState(true);
  const [showNewRidePanel, setShowNewRidePanel] = useState(
    safeJSONParse("showPanel", false)
  );
  const [showBtn, setShowBtn] = useState(
    safeJSONParse("showBtn", "accept")
  );

  const acceptRide = async () => {
    try {
      if (newRide._id != "") {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/ride/confirm`,
          { rideId: newRide._id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setLoading(false);
        setShowBtn("start");
        Console.log(response);
      }
    } catch (error) {
      setLoading(false);
      showAlert('حدث خطأ', error.response?.data?.message || 'حدث خطأ', 'failure');
      Console.log(error.response);
      setTimeout(() => {
        clearRideData();
      }, 1000);
    }
  };

  const startRide = async () => {
    try {
      if (newRide._id != "") {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/ride/start-ride?rideId=${newRide._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setShowBtn("end-ride");
        setLoading(false);
        Console.log(response);
      }
    } catch (err) {
      setLoading(false);
      showAlert('حدث خطأ', 'حدث خطأ أثناء بدء الرحلة', 'failure');
      Console.log(err);
    }
  };

  const endRide = async () => {
    try {
      if (newRide._id != "") {
        setLoading(true);
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/ride/end-ride`,
          {
            rideId: newRide._id,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setShowBtn("accept");
        setLoading(false);
        setShowCaptainDetailsPanel(true);
        setShowNewRidePanel(false);
        setNewRide(defaultRideData);
        localStorage.removeItem("rideDetails");
        localStorage.removeItem("showPanel");
      }
    } catch (err) {
      setLoading(false);
      Console.log(err);
    }
  };

  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setRiderLocation({
            ltd: position.coords.latitude,
            lng: position.coords.longitude,
          });

          socket.emit("update-location-captain", {
            userId: captain._id,
            location: {
              ltd: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
        },
        (error) => {
          console.error("Error fetching position:", error);
        }
      );
    }
  };

  const clearRideData = () => {
    setShowBtn("accept");
    setLoading(false);
    setShowCaptainDetailsPanel(true);
    setShowNewRidePanel(false);
    setNewRide(defaultRideData);
    localStorage.removeItem("rideDetails");
    localStorage.removeItem("showPanel");
  }

  useEffect(() => {
    let locationInterval;

    if (captain._id) {
      socket.emit("join", {
        userId: captain._id,
        userType: "captain",
      });

      updateLocation();

      locationInterval = setInterval(() => {
        updateLocation();
      }, 10000);
    }

    socket.on("new-ride", (data) => {
      Console.log("New Ride available:", data);
      setShowBtn("accept");
      setNewRide(data);
      setShowNewRidePanel(true);
    });

    socket.on("ride-cancelled", (data) => {
      Console.log("Ride cancelled", data);
      updateLocation();
      clearRideData();
    });

    return () => {
      if (locationInterval) clearInterval(locationInterval);
      socket.off("new-ride");
      socket.off("ride-cancelled");
    };
  }, [captain]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    socket.emit("join-room", newRide._id);

    socket.on("receiveMessage", async (msg) => {
      setMessages((prev) => [...prev, { msg, by: "other" }]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [newRide]);

  useEffect(() => {
    localStorage.setItem("rideDetails", JSON.stringify(newRide));
  }, [newRide]);

  useEffect(() => {
    localStorage.setItem("showPanel", JSON.stringify(showNewRidePanel));
    localStorage.setItem("showBtn", JSON.stringify(showBtn));
  }, [showNewRidePanel, showBtn]);

  const calculateEarnings = () => {
    let Totalearnings = 0;
    let Todaysearning = 0;

    let acceptedRides = 0;
    let cancelledRides = 0;

    let distanceTravelled = 0;

    const today = new Date();
    const todayWithoutTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    (captain.rides || []).forEach((ride) => {
      if (ride?.status === "completed") {
        acceptedRides++;
        distanceTravelled += ride?.distance || 0;
      }
      if (ride?.status === "cancelled") cancelledRides++;

      Totalearnings += ride?.fare || 0;

      if (!ride?.updatedAt) return;

      const rideDate = new Date(ride.updatedAt);

      const rideDateWithoutTime = new Date(
        rideDate.getFullYear(),
        rideDate.getMonth(),
        rideDate.getDate()
      );

      if (
        rideDateWithoutTime.getTime() === todayWithoutTime.getTime() &&
        ride.status === "completed"
      ) {
        Todaysearning += ride.fare;
      }
    });

    setEarnings({ total: Totalearnings, today: Todaysearning });
    setRides({
      accepted: acceptedRides,
      cancelled: cancelledRides,
      distanceTravelled: Math.round(distanceTravelled / 1000),
    });
  };

  useEffect(() => {
    if (captain?._id) calculateEarnings();
  }, [captain]);

  useEffect(() => {
    if (socket.id) Console.log("socket id:", socket.id);
  }, [socket.id]);

  const vehicleNames = {
    tuktuk: "توكتوك",
    car: "سيارة",
    bike: "موتوسيكل",
    torsicle: "تورسيكل",
    delivery: "ديليفري",
  };

  return (
    <div
      className="relative w-full h-dvh bg-contain"
      style={{ backgroundImage: `url(${map})` }}
    >
      <Alert
        heading={alert.heading}
        text={alert.text}
        isVisible={alert.isVisible}
        onClose={hideAlert}
        type={alert.type}
      />
      <Sidebar />

      {/* SOS Button (only visible when captain has an active ride) */}
      {newRide?._id && showBtn === "end-ride" && (
        <button
          onClick={() => alert("تم إرسال بلاغ الطوارئ (SOS) وجاري تحديد موقعك للإغاثة فوراً!")}
          className="absolute top-20 right-4 z-20 bg-red-600 text-white font-bold px-4 py-2.5 rounded-full shadow-lg hover:bg-red-700 hover:scale-105 transition-all flex items-center gap-2 border-2 border-white ring-4 ring-red-500/30 animate-pulse"
        >
          <span className="text-xl">🚨</span> SOS
        </button>
      )}

      {/* Full-screen Interactive React Leaflet Map */}
      <div className="absolute inset-0 w-full h-full z-0">
        <LiveMap
          captainLocation={{ lat: riderLocation.ltd, lng: riderLocation.lng }}
          captainVehicle={captain?.vehicle?.type}
          activeCaptains={[]} // Optionally show other captains if requested
          pickupLocation={newRide.pickup ? { lat: null, lng: null } : null} // Can populate with real geocoded pickup later
          destinationLocation={newRide.destination ? { lat: null, lng: null } : null}
        />
      </div>

      {!riderLocation.ltd && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg z-20 font-bold text-blue-600 flex items-center gap-2">
          <span>⏳</span> جاري تحديد موقعك بدقة...
        </div>
      )}

      {showCaptainDetailsPanel && captain?._id && (
        <div className="absolute bottom-0 flex flex-col justify-start p-5 pb-6 gap-2 rounded-t-3xl bg-white/90 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white/40 h-fit w-full transition-transform duration-300">
          {/* Drag Handle Indicator */}
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2 opacity-60"></div>
          {/* Driver details */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="my-2 select-none rounded-full w-10 h-10 bg-blue-400 mx-auto flex items-center justify-center">
                <h1 className="text-lg text-white">
                  {captain?.fullname?.firstname?.[0]}
                  {captain?.fullname?.lastname?.[0]}
                </h1>
              </div>

              <div>
                <h1 className="text-lg font-semibold leading-6">
                  {captain?.fullname?.firstname} {captain?.fullname?.lastname}
                </h1>
                <p className="text-xs flex items-center gap-1 text-gray-500 ">
                  <Phone size={12} />
                  {captain?.phone}
                </p>
              </div>
            </div>

            <div className="text-left">
              <p className="text-xs text-gray-500 ">الأرباح</p>
              <h1 className="font-semibold">{earnings.today} ج.م</h1>
            </div>
          </div>

          {/* Ride details */}
          <div className="flex justify-around items-center mt-2 py-4 rounded-lg bg-zinc-800">
            <div className="flex flex-col items-center text-white">
              <h1 className="mb-1 text-xl">{rides?.accepted}</h1>
              <p className="text-xs text-gray-400 text-center leading-3">
                رحلات
                <br />
                مقبولة
              </p>
            </div>
            <div className="flex flex-col items-center text-white">
              <h1 className="mb-1 text-xl">{rides?.distanceTravelled}</h1>
              <p className="text-xs text-gray-400 text-center leading-3">
                كم
                <br />
                مسافة
              </p>
            </div>
            <div className="flex flex-col items-center text-white">
              <h1 className="mb-1 text-xl">{rides?.cancelled}</h1>
              <p className="text-xs text-gray-400 text-center leading-3">
                رحلات
                <br />
                ملغية
              </p>
            </div>
          </div>

          {/* Car details */}
          <div className="flex justify-between border-2 items-center pr-3 py-2 rounded-lg">
            <div>
              <h1 className="text-lg font-semibold leading-6 tracking-tighter ">
                {captain?.vehicle?.number}
              </h1>
              <p className="text-xs text-gray-500 flex items-center">
                {captain?.vehicle?.color} |
                <User size={12} strokeWidth={2.5} /> {captain?.vehicle?.capacity}
              </p>
            </div>

            <img
              className="rounded-full h-16 scale-x-[-1]"
              src={
                captain?.vehicle?.type == "car"
                  ? "/car.png"
                  : captain?.vehicle?.type == "tuktuk"
                    ? "/auto.webp"
                    : `/${captain?.vehicle?.type || 'bike'}.webp`
              }
              alt="صورة المركبة"
            />
          </div>
        </div>
      )}

      <NewRide
        rideData={newRide}
        otp={otp}
        setOtp={setOtp}
        showBtn={showBtn}
        showPanel={showNewRidePanel}
        setShowPanel={setShowNewRidePanel}
        showPreviousPanel={setShowCaptainDetailsPanel}
        loading={loading}
        acceptRide={acceptRide}
        startRide={startRide}
        endRide={endRide}
        error={error}
      />
    </div>
  );
}

export default CaptainHomeScreen;
