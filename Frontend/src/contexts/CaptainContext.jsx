import { createContext, useContext, useState } from "react";

export const captainDataContext = createContext();

const safeJSONParse = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item && item !== "undefined" ? JSON.parse(item) : fallback;
  } catch (error) {
    return fallback;
  }
};

function CaptainContext({ children }) {
  const userData = safeJSONParse("userData", null);

  const [captain, setCaptain] = useState(
    userData?.type === "captain" && userData?.data
      ? {
        ...userData.data,
        fullname: userData.data.fullname || { firstname: "", lastname: "" },
        vehicle: userData.data.vehicle || { color: "", number: "", capacity: 0, type: "tuktuk" },
        rides: userData.data.rides || [],
      }
      : {
        fullname: {
          firstname: "",
          lastname: "",
        },
        phone: "",
        vehicle: {
          color: "",
          number: "",
          capacity: 0,
          type: "tuktuk",
        },
        rides: [],
        status: "inactive",
      }
  );

  return (
    <captainDataContext.Provider value={{ captain, setCaptain }}>
      {children}
    </captainDataContext.Provider>
  );
}

export const useCaptain = () => {
  const { captain, setCaptain } = useContext(captainDataContext);
  return { captain, setCaptain };
};

export default CaptainContext;
