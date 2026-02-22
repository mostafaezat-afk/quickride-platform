import { createContext, useContext, useState } from "react";

export const userDataContext = createContext();

const safeJSONParse = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item && item !== "undefined" ? JSON.parse(item) : fallback;
  } catch (error) {
    return fallback;
  }
};

const UserContext = ({ children }) => {
  const userData = safeJSONParse("userData", null);

  const [user, setUser] = useState(
    userData?.type === "user" && userData?.data
      ? {
        ...userData.data,
        fullname: userData.data.fullname || { firstname: "", lastname: "" },
      }
      : {
        email: "",
        phone: "",
        fullname: {
          firstname: "",
          lastname: "",
        },
      }
  );

  return (
    <userDataContext.Provider value={{ user, setUser }}>
      {children}
    </userDataContext.Provider>
  );
};

export const useUser = () => {
  const { user, setUser } = useContext(userDataContext);
  return { user, setUser };
};

export default UserContext;
