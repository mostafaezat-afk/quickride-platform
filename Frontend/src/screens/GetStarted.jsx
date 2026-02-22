import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/index";
import background from "/get_started_illustration.jpg";
import { useNavigate } from "react-router-dom";

function GetStarted() {
  const navigate = useNavigate();
  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      if (JSON.parse(userData).type == "user") {
        navigate("/home");
      } else if (JSON.parse(userData).type == "captain") {
        navigate("/captain/home");
      }
    }
  }, []);
  return (
    <div
      className="flex flex-col justify-between w-full h-full bg-cover bg-center"
      style={{ backgroundImage: `url(${background})` }}
    >
      <h1 className="text-2xl font-bold text-white m-4 self-start" style={{ fontFamily: 'Cairo, sans-serif' }}>
        🛺 توصيلة بشتيل
      </h1>

      <div
        className="flex flex-col bg-white p-4 pb-8 gap-8 rounded-t-lg"
      >
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Cairo, sans-serif' }}>ابدأ مع توصيلة بشتيل</h1>
        <Button
          title={"متابعة"}
          path={"/login"}
          type={"link"}
          icon={<ArrowLeft />}
        />
      </div>
    </div>
  );
}

export default GetStarted;
