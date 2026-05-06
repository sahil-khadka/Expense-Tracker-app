import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "../constants/api.js";
import { toast } from "react-toastify";
import sideImage from "../assets/log&sign.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState(location.state?.email || localStorage.getItem("otpEmail") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      setError("Email is missing. Please restart the reset flow.");
    }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast("Email is missing. Please restart the reset flow.", { type: "error", autoClose: 1500 });
      return;
    }
    if (password !== confirmPassword) {
      toast("Passwords must match.", { type: "error", autoClose: 1500 });
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        "/changepassword",
        { email, password, confirmpassword: confirmPassword },
        { withCredentials: true },
      );
      setSuccess(true);
      localStorage.removeItem("otpEmail");
      localStorage.removeItem("otpFlow");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
        
      const message = err.response?.data?.message || "Please use a valid password with at least 8 characters, including uppercase, lowercase, number, and special character.";
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
          alt="Reset password illustration"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-10">
            <h1 className="text-4xl italic font-serif text-[#2f5c2b] mb-2">Reset Password</h1>
            <p className="text-gray-500 text-[15px]">
              Create a new password to complete your reset.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-800 text-[16px] font-medium mb-2">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#dcdcdc] text-gray-800 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#2f5c2b]/50 border border-transparent transition-colors"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-gray-800 text-[16px] font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#dcdcdc] text-gray-800 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#2f5c2b]/50 border border-transparent transition-colors"
                placeholder="Confirm new password"
              />
            </div>

            {success && <p className="text-sm text-green-600">Password reset successfully. Redirecting to login...</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-[16px] font-semibold transition-colors ${
                loading ? "bg-[#86a892] cursor-not-allowed text-white" : "bg-[#2d6a3f] text-white hover:bg-[#245534]"
              }`}
            >
              {loading ? "Resetting password..." : "Reset password"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Remembered it?{' '}
              <Link to="/login" className="text-[#2d6a3f] font-bold hover:underline">
                Login now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
