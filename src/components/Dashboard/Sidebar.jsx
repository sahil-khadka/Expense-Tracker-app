import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "../../constants/api.js";
import { toast } from "react-toastify";
import { clearAuth } from "../../constants/auth.js";
import { Home, Wallet, Target, Clock, BarChart, LogOut } from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("/logout", {}, { withCredentials: true });
      toast("You have logged out successfully", {
        type: "success",
        autoClose: 1200,
      });
    } catch (err) {
      // ignore
    } finally {
      clearAuth();
      navigate("/");
    }
  };

  return (
    <aside
      className="fixed top-16 left-0 bottom-0 w-64 flex flex-col justify-between px-6 py-8 z-20 rounded-r-2xl overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(18,77,34,0.95), rgba(58,130,67,0.95))",
        color: "#eaf6ea",
      }}
    >
      <nav className="flex flex-col gap-6 mt-8 text-lg">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 ${
              isActive
                ? "text-white font-medium pl-3 border-l-4 border-white/30"
                : "text-white/85"
            }`
          }
        >
          <Home className="w-5 h-5 opacity-90" />
          Dashboard
        </NavLink>

        <NavLink
          to="/e-wallet"
          className={({ isActive }) =>
            `flex items-center gap-3 ${
              isActive
                ? "text-white font-medium pl-3 border-l-4 border-white/30"
                : "text-white/85"
            }`
          }
        >
          <Wallet className="w-5 h-5 opacity-90" />
          E-wallet
        </NavLink>

        <NavLink
          to="/set-goals"
          className={({ isActive }) =>
            `flex items-center gap-3 ${
              isActive
                ? "text-white font-medium pl-3 border-l-4 border-white/30"
                : "text-white/85"
            }`
          }
        >
          <Target className="w-5 h-5 opacity-90" />
          Set goals
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            `flex items-center gap-3 ${
              isActive
                ? "text-white font-medium pl-3 border-l-4 border-white/30"
                : "text-white/85"
            }`
          }
        >
          <Clock className="w-5 h-5 opacity-90" />
          History
        </NavLink>

        <NavLink
          to="/report"
          className={({ isActive }) =>
            `flex items-center gap-3 ${
              isActive
                ? "text-white font-medium pl-3 border-l-4 border-white/30"
                : "text-white/85"
            }`
          }
        >
          <BarChart className="w-5 h-5 opacity-90" />
          Report
        </NavLink>
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 text-white/90 hover:opacity-95 transition-opacity mb-4 group"
      >
        <LogOut className="w-6 h-6 transform rotate-180" />
        <span className="text-lg">Log out</span>
      </button>
    </aside>
  );
}
