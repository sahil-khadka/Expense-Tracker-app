import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import sideImage from "../assets/log&sign.png";
import axios from "../constants/api.js";
import { toast } from "react-toastify";
import BackHomeButton from "../components/BackHomeButton.jsx";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeToTerms) return;

    if (form.password !== form.confirmPassword) {
      toast("Passwords do not match", { type: "error" });
      return;
    }

    setLoading(true);

    try {
      const data = await axios.post(
        "/register",
        {
          // include multiple keys to match various backend expectations
          name: form.name,
          userName: form.name,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          conformpassword: form.confirmPassword,
        },
        { withCredentials: true },
      );

      console.log("Registration success:", data);
      toast("Registration Sucessfull", { type: "success", autoClose: 1000 });
      setTimeout(() => {
        navigate("/otp", { state: { email: form.email } });
      }, 1000);
    } catch (error) {
      console.error("Registration error:", error);

      // Prefer server-provided message for debugging
      let errorMessage = "Registration failed. Please try again.";
      if (error.response?.data) {
        // show full server response message when available
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors?.length > 0) {
          errorMessage = error.response.data.errors[0].message;
        } else {
          // fallback: stringify response body
          try {
            errorMessage = JSON.stringify(error.response.data);
          } catch (e) {
            // ignore
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast(errorMessage, { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGoogleLogin = () => {
    window.location.href = "/loginwithgoogle";
  };

  return (
    <div className="flex h-screen w-full bg-white font-sans text-gray-800 overflow-hidden">
      <BackHomeButton />
      {/* Left Panel - Image */}
      <div className="hidden md:block md:w-1/2 relative bg-[#f4f4f4]">
        <img
          src={sideImage}
          className="absolute inset-0 w-full h-full object-cover object-center"
          alt="Budget Planner"
        />
      </div>

      {/* Right Panel - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 sm:p-12 h-full overflow-y-auto">
        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-5xl font-serif italic text-[#3B5A3B] mb-2">
              Spend Wise
            </h1>
            <p className="text-sm text-gray-500">
              Where your spending finds balance
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label className="block text-[15px] font-medium text-gray-800 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full p-3.5 rounded bg-[#d9d9d9] focus:outline-none focus:ring-2 focus:ring-[#3B5A3B]"
                placeholder=""
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[15px] font-medium text-gray-800 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full p-3.5 rounded bg-[#d9d9d9] focus:outline-none focus:ring-2 focus:ring-[#3B5A3B]"
                placeholder=""
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[15px] font-medium text-gray-800 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full p-3.5 rounded bg-[#d9d9d9] focus:outline-none focus:ring-2 focus:ring-[#3B5A3B] pr-12"
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    // Eye Open Icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.36.07.73 0 1.084C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ) : (
                    // Eye Slash Icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[15px] font-medium text-gray-800 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full p-3.5 rounded bg-[#d9d9d9] focus:outline-none focus:ring-2 focus:ring-[#3B5A3B] pr-12"
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    // Eye Open Icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.36.07.73 0 1.084C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ) : (
                    // Eye Slash Icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Privacy Policy */}
            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-500">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 rounded text-[#3B5A3B] focus:ring-[#3B5A3B] cursor-pointer"
              />
              <span>
                I agree to the{" "}
                <span className="text-[#3B5A3B] font-bold cursor-pointer">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-[#3B5A3B] font-bold cursor-pointer">
                  Privacy Policy
                </span>
              </span>
            </label>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading || !agreeToTerms}
              className={`w-full py-3.5 rounded text-[15px] font-semibold transition-colors mt-2 ${
                loading || !agreeToTerms
                  ? "bg-[#86a892] cursor-not-allowed text-white"
                  : "bg-[#3B5A3B] hover:bg-[#2e472e] text-white"
              }`}
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 whitespace-nowrap">
                Or continue with:
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2.5 w-full py-3 rounded border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
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
          </form>

          {/* Login Link */}
          <p className="text-center mt-6 text-[13px] text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#3B5A3B] font-bold hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
