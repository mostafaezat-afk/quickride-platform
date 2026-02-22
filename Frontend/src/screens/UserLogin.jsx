import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import Console from "../utils/console";

function UserLogin() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();

  const loginUser = async (data) => {
    if (data.phone.trim() !== "" && data.password.trim() !== "") {
      try {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/user/login`,
          data
        );
        Console.log(response);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userData", JSON.stringify({
          type: "user",
          data: response.data.user,
        }));
        navigation("/home");
      } catch (error) {
        setResponseError(error.response?.data?.message || "حدث خطأ");
        Console.log(error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setResponseError("");
    }, 5000);
  }, [responseError]);
  return (
    <div className="w-full h-dvh flex flex-col justify-between p-4 pt-6" style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div>
        <Heading title={"تسجيل دخول الراكب 🧑🏻"} />
        <form onSubmit={handleSubmit(loginUser)}>
          <Input
            label={"رقم الهاتف"}
            type={"tel"}
            name={"phone"}
            register={register}
            error={errors.phone}
          />
          <Input
            label={"كلمة المرور"}
            type={"password"}
            name={"password"}
            register={register}
            error={errors.password}
          />
          {responseError && (
            <p className="text-sm text-center mb-4 text-red-500">
              {responseError}
            </p>
          )}
          <Button title={"تسجيل الدخول"} loading={loading} type="submit" />
        </form>
        <p className="text-sm font-normal text-center mt-4">
          ليس لديك حساب؟{" "}
          <Link to={"/signup"} className="font-semibold">
            إنشاء حساب
          </Link>
        </p>

      </div>
      <div>
        <Button
          type={"link"}
          path={"/captain/login"}
          title={"دخول كسائق"}
          classes={"bg-orange-500"}
        />
        <p className="text-xs font-normal text-center self-end mt-6">
          توصيلة بشتيل 🛺 - خدمة التوصيل الآمنة
        </p>
      </div>
    </div>
  );
}

export default UserLogin;
