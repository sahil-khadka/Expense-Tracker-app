import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../constants/api.js";
import { AUTH_STORAGE_KEY, setAuth } from "../constants/auth";

export default function OtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "your email";

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [focused, setFocused] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [shake, setShake] = useState(false);
  const inputs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer === 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter all 6 digits.");
      triggerShake();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(
        "/verify-otp",
        { email, otp: code },
        { withCredentials: true },
      );
      console.log("OTP verification success:", data);
      // mark user as authenticated (persist by default after verification)
      setAuth(true, true);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Network error. Please try again.",
      );
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleResend = () => {
    if (!canResend) return;
    setCanResend(false);
    setResendTimer(30);
    setOtp(Array(6).fill(""));
    setError("");
    inputs.current[0]?.focus();
    // TODO: Call resend API if available
  };

  const allFilled = otp.every((d) => d !== "");

  return (
    <div className="flex h-screen w-full items-center justify-center p-5 font-sans bg-gradient-to-br from-[#f0f7f1] via-white to-[#e8f4ea] relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="fixed -top-20 -left-20 w-80 h-80 rounded-full bg-[#2d6a3f]/10 pointer-events-none"></div>
      <div className="fixed -bottom-16 -right-16 w-64 h-64 rounded-full bg-[#2d6a3f]/5 pointer-events-none"></div>

      <div
        className={`w-full max-w-[440px] bg-white rounded-3xl p-11 pb-12 shadow-[0_4px_40px_rgba(0,0,0,0.09)] relative overflow-hidden animate-fade-in-up ${shake ? "animate-shake" : ""}`}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2d6a3f] to-[#52a067]"></div>

        {success ? (
          <div className="text-center py-5 animate-scale-up">
            <div className="w-20 h-20 rounded-full bg-[#edf5ef] flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-10 h-10 text-[#2d6a3f]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-3xl font-serif text-gray-900">
              Verified!
            </h2>
            <p className="text-gray-500 text-sm">
              Redirecting you to your dashboard…
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#edf5ef] flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-[#2d6a3f]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="mb-2 text-3xl font-serif italic text-[#2d6a3f]">
                Check your inbox
              </h1>
              <p className="text-[13.5px] text-gray-500">
                We sent a 6-digit code to
                <br />
                <strong className="text-gray-700 font-medium">{email}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                className="flex justify-center gap-2.5 mb-6"
                onPaste={handlePaste}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={() => {
                      setFocused(i);
                      setError("");
                    }}
                    onBlur={() => setFocused(null)}
                    autoFocus={i === 0}
                    className={`w-[52px] h-[62px] rounded-xl border-2 bg-[#f2f2f2] text-2xl font-semibold text-center outline-none transition-all caret-[#2d6a3f]
                      ${focused === i ? "border-[#2d6a3f] bg-white shadow-[0_0_0_2px_rgba(45,106,63,0.1)]" : "border-transparent"}
                      ${digit && focused !== i ? "border-[#2d6a3f] bg-[#edf5ef]" : ""}
                      ${error && !digit ? "border-red-500 bg-red-50" : ""}
                    `}
                  />
                ))}
              </div>

              {error && (
                <p className="mb-4 text-center text-[13px] text-red-500 font-medium animate-fade-in-up">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !allFilled}
                className={`w-full py-3.5 rounded-xl font-semibold text-[15px] tracking-wide transition-all
                  ${
                    allFilled && !loading
                      ? "bg-[#2d6a3f] hover:bg-[#245534] text-white cursor-pointer"
                      : "bg-[#a8c5af] text-white cursor-not-allowed"
                  }`}
              >
                {loading ? "Verifying…" : "Verify Code"}
              </button>
            </form>

            <p className="text-center mt-6 text-[13px] text-gray-500">
              Didn't receive it?{" "}
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-[#2d6a3f] font-bold hover:underline"
                >
                  Resend code
                </button>
              ) : (
                <span className="text-gray-400">
                  Resend in{" "}
                  <strong className="text-gray-600">{resendTimer}s</strong>
                </span>
              )}
            </p>

            <div className="text-center mt-4 text-[13px]">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-[#2d6a3f] font-bold hover:underline"
              >
                ← Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
