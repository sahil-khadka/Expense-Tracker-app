import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../constants/api.js";
import { toast } from "react-toastify";
import sideImage from "../assets/log&sign.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        "/forgetpassword",
        { email },
        { withCredentials: true },
      );
      setSuccess(true);
      localStorage.setItem("otpEmail", email);
      localStorage.setItem("otpFlow", "reset");
      setTimeout(() => {
        navigate("/otp", { state: { email, flow: "reset" } });
      }, 900);
    } catch (err) {
      const message = err.response?.data?.message || "Unable to send reset code.";
      toast(message, { type: "error", autoClose: 1500 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      <div className="hidden md:block md:w-1/2 relative bg-[#f4f4f4]">
        <img
          src={sideImage}
          alt="Forgot password illustration"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-10">
            <h1 className="text-4xl italic font-serif text-[#2f5c2b] mb-2">Forgot Password</h1>
            <p className="text-gray-500 text-[15px]">
              Enter your email and we will send you a one-time reset code.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-800 text-[16px] font-medium mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#dcdcdc] text-gray-800 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#2f5c2b]/50 border border-transparent transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {success && <p className="text-sm text-green-600">Reset code sent. Check your inbox.</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-[16px] font-semibold transition-colors ${
                loading ? "bg-[#86a892] cursor-not-allowed text-white" : "bg-[#2d6a3f] text-white hover:bg-[#245534]"
              }`}
            >
              {loading ? "Sending code..." : "Send reset code"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Remembered your password?{' '}
              <Link to="/login" className="text-[#2d6a3f] font-bold hover:underline">
                Login instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
