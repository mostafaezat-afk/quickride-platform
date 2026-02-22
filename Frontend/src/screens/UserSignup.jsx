import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import Console from "../utils/console";

function UserSignup() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();
  const signupUser = async (data) => {
    const userData = {
      fullname: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      password: data.password,
      phone: data.phone
    };

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/user/register`,
        userData
      );
      Console.log(response);
      localStorage.setItem("token", response.data.token);
      navigation("/home");
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
        <Heading title={"إنشاء حساب راكب 🧑🏻"} />
        <form onSubmit={handleSubmit(signupUser)}>
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
          <Button title={"إنشاء حساب"} loading={loading} type="submit" />
        </form>
        <p className="text-sm font-normal text-center mt-4">
          لديك حساب بالفعل؟{" "}
          <Link to={"/login"} className="font-semibold">
            تسجيل الدخول
          </Link>
        </p>
      </div>
      <div>
        <Button
          type={"link"}
          path={"/captain/signup"}
          title={"التسجيل كسائق"}
          classes={"bg-orange-500"}
        />
        <p className="text-xs font-normal text-center self-end mt-6">
          توصيلة بشتيل 🛺 - خدمة التوصيل الآمنة
        </p>
      </div>
    </div>
  );
}

export default UserSignup;
