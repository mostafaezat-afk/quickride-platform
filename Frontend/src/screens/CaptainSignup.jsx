import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import { ArrowRight, ChevronLeft } from "lucide-react";
import Console from "../utils/console";

function CaptainSignup() {
  const [responseError, setResponseError] = useState("");
  const [showVehiclePanel, setShowVehiclePanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();
  const signupCaptain = async (data) => {

    const captainData = {
      fullname: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      password: data.password,
      phone: data.phone,
      vehicle: {
        color: data.color,
        number: data.number,
        capacity: data.capacity,
        type: data.type,
      },
    };
    Console.log(captainData);

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/captain/register`,
        captainData
      );
      Console.log(response);
      localStorage.setItem("token", response.data.token);
      navigation("/captain/home");
    } catch (error) {
      Console.log(error);
      const errData = error.response?.data;
      let errMsg = "حدث خطأ غير متوقع. تأكد من الاتصال بالسيرفر.";
      if (Array.isArray(errData)) {
        errMsg = errData.map(e => e.msg).join("، ");
      } else if (errData?.message) {
        errMsg = errData.message;
      } else if (error.message) {
        errMsg = error.message;
      }
      setResponseError(errMsg);
      setShowVehiclePanel(false);
    } finally {
      setLoading(false);
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
        <Heading title={"تسجيل سائق جديد 🚕"} />
        <form onSubmit={handleSubmit(signupCaptain)}>
          {!showVehiclePanel && (
            <>
              <div className="flex gap-4 -mb-2">
                <Input
                  label={"الاسم الأول"}
                  name={"firstname"}
                  register={register}
                  error={errors.firstname}
                />
                <Input
                  label={"اسم العائلة"}
                  name={"lastname"}
                  register={register}
                  error={errors.lastname}
                />
              </div>
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
              <div
                className={`cursor-pointer flex justify-center items-center gap-2 py-3 font-semibold bg-black text-white w-full rounded-lg`}
                onClick={() => {
                  setShowVehiclePanel(true);
                }}
              >
                التالي <ChevronLeft strokeWidth={2.5} />
              </div>
            </>
          )}
          {showVehiclePanel && (
            <>
              <ArrowRight
                onClick={() => {
                  setShowVehiclePanel(false);
                }}
                className="cursor-pointer -mr-1 mb-4"
              />
              <div className="flex gap-4 -my-2">
                <Input
                  label={"لون المركبة"}
                  name={"color"}
                  register={register}
                  error={errors.color}
                />
                <Input
                  label={"عدد الركاب"}
                  type={"number"}
                  name={"capacity"}
                  register={register}
                  error={errors.capacity}
                />
              </div>
              <Input
                label={"رقم اللوحة"}
                name={"number"}
                register={register}
                error={errors.number}
              />
              <Input
                label={"نوع المركبة"}
                type={"select"}
                options={["توكتوك", "موتوسيكل", "تورسيكل", "ديليفري"]}
                optionValues={["tuktuk", "bike", "torsicle", "delivery"]}
                name={"type"}
                register={register}
                error={errors.type}
              />

              {responseError && (
                <p className="text-sm text-center mb-4 text-red-500">
                  {responseError}
                </p>
              )}
              <Button title={"إنشاء حساب"} loading={loading} type="submit" />
            </>
          )}
        </form>
        <p className="text-sm font-normal text-center mt-4">
          لديك حساب بالفعل؟{" "}
          <Link to={"/captain/login"} className="font-semibold">
            تسجيل الدخول
          </Link>
        </p>
      </div>
      <div>
        <Button
          type={"link"}
          path={"/signup"}
          title={"التسجيل كراكب"}
          classes={"bg-green-500"}
        />
        <p className="text-xs font-normal text-center self-end mt-6">
          توصيلة بشتيل 🛺 - خدمة التوصيل الآمنة
        </p>
      </div>
    </div>
  );
}

export default CaptainSignup;
