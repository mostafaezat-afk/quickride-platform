import { Button } from "../components";
import { useNavigate } from "react-router-dom";

const Error = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full h-dvh flex items-center text-center p-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div className="">
        <h1 className="text-6xl font-bold">404</h1>

        <h2 className="text-3xl font-semibold">الصفحة غير موجودة</h2>
        <p className="text-gray-600 my-6">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <Button
          title="العودة للرئيسية"
          classes="bg-orange-500"
          fun={() => navigate("/")}
        />
      </div>
    </div>
  );
};

export default Error;
