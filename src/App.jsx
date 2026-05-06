import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import landing from "./assets/landingImange.png";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import OtpVerification from "./pages/OtpVerification";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Ewallet from "./pages/Ewallet";
import SetGoals from "./pages/SetGoals";
import History from "./pages/History";
import Report from "./pages/Report";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import { AUTH_STORAGE_KEY, getAuth } from "./constants/auth.js";

function App() {
  const location = useLocation();
  const hideNavbarRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/otp",
    "/reset-password",
    "/dashboard",
    "/e-wallet",
    "/set-goals",
    "/history",
    "/report",
  ];
  const [isAuthenticated, setIsAuthenticated] = useState(() => getAuth());

  useEffect(() => {
    const handleStorage = () => {
      // handle localStorage changes (cross-tab) and refresh auth state
      setIsAuthenticated(getAuth());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    setIsAuthenticated(getAuth());
  }, [location.pathname]);

  // Navbar is now rendered inside Home.jsx for the landing page
  return (
    <div className="min-h-screen">
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/otp"
            element={
              <PublicRoute>
                <OtpVerification />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/e-wallet"
            element={
              <ProtectedRoute>
                <Ewallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/set-goals"
            element={
              <ProtectedRoute>
                <SetGoals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
