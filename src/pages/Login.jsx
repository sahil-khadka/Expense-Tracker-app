import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logSignImage from "../assets/log&sign.png";
import axios from "../constants/api.js";
import { toast } from "react-toastify";
import {
  AUTH_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  setAuth,
  setToken,
  setUserName,
} from "../constants/auth.js";
import BackHomeButton from "../components/BackHomeButton.jsx";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState("");
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("sending req1");
      const response = await axios.post(
        "/login",
        {
          email: form.email,
          password: form.password,
        },
        { withCredentials: true },
      );
      console.log("sending req2");

      if (response.status === 200) {
        console.log("Login successfully");
        toast("Login Successful", { type: "success", autoClose: 1000 });
        // persist login according to remember checkbox
        setAuth(true, remember);
        // store token if backend returned one (supports both 'token' and 'accessToken')
        const token =
          response?.data?.token ||
          response?.data?.accessToken ||
          response?.data?.data?.token;
        if (token) {
          setToken(token, remember);
        }
        // store display name if backend returned it (prefer userName, then name, then email)
        const resp = response?.data || {};
        const maybeUser = resp.user || resp.data || resp;
        try {
          const displayRaw =
            maybeUser?.userName || maybeUser?.name || maybeUser?.email || null;
          if (displayRaw) {
            const display =
              typeof displayRaw === "string" && displayRaw.includes("@")
                ? displayRaw.split("@")[0]
                : displayRaw;
            setUserName(display, remember);
          }
        } catch (e) {
          // ignore
        }
        navigate("/dashboard");
      }
    } catch (error) {
      toast(
        error?.response?.data?.message || "Login failed. Please try again.",
        { type: "error", autoClose: 1000 },
      );
    } finally {
      console.log("sending req3");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      window.location.href = "/loginwithgoogle";
    } catch (error) {
      toast("Google login failed. Please try again.", {
        type: "error",
        autoClose: 1000,
      });
    }
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      <BackHomeButton />
      {/* Left Image Section */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#f1efe9]">
        <img
          src={logSignImage}
          alt="Budget Planner Desktop"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Right Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24">
        <div className="w-full max-w-[400px]">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl italic font-serif text-[#2f5c2b] mb-2">
              Spend Wise
            </h1>
            <p className="text-gray-500 text-[15px]">
              Where your spending finds balance
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label className="block text-gray-800 text-[16px] font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused("")}
                className={`w-full bg-[#dcdcdc] text-gray-800 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#2f5c2b]/50 border-2 ${
                  focused === "email"
                    ? "border-[#2d6a3f]"
                    : "border-transparent"
                } transition-colors`}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-800 text-[16px] font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={set("password")}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                  className={`w-full bg-[#dcdcdc] text-gray-800 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-[#2f5c2b]/50 border-2 ${
                    focused === "password"
                      ? "border-[#2d6a3f]"
                      : "border-transparent"
                  } transition-colors`}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center gap-2 cursor-pointer text-gray-500 text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded text-[#5f8a5a] bg-[#dcdcdc] border-none focus:ring-[#5f8a5a] cursor-pointer"
                />
                Remember me
              </label>
              <a
                href="#"
                className="text-sm text-[#2d6a3f] font-bold hover:text-[#1a4026]"
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-6 py-3 rounded-lg text-[16px] font-semibold transition-colors ${
                loading
                  ? "bg-[#86a892] cursor-not-allowed text-white"
                  : "bg-[#2d6a3f] text-white hover:bg-[#245534]"
              } tracking-wide`}
            >
              {loading ? "Signing in..." : "Log in"}
            </button>
          </form>

          {/* Or Divider */}
          <div className="flex items-center my-8">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-800 font-medium">
              Or continue with:
            </span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Google Icon */}
          <div className="flex justify-center mb-8">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="px-6 py-2 border rounded flex items-center justify-center gap-2 hover:bg-gray-50 focus:outline-none transition-colors w-full"
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Google</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center text-sm font-medium text-gray-800">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#2f5c2b] hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
