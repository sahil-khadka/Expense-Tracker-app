import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "../../constants/api.js";
import { toast } from "react-toastify";
import { clearAuth } from "../../constants/auth.js";
import {
  Home,
  Wallet,
  Target,
  Clock,
  BarChart,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      document.documentElement.style.setProperty(
        "--sidebar-width",
        collapsed ? "48px" : "220px"
      );
    } catch (e) {
      // ignore in non-browser environments
    }
  }, [collapsed]);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("/logout", {}, { withCredentials: true });
      toast("You have logged out successfully", {
        type: "success",
        autoClose: 1500,
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
      className={`fixed top-16 left-0 bottom-0 flex flex-col justify-between px-1 py-8 z-20 rounded-r-2xl overflow-visible ${
        collapsed ? "collapsed" : ""
      }`}
      style={{
        width: collapsed ? "48px" : "220px",
        paddingLeft: collapsed ? 6 : 16,
        paddingRight: collapsed ? 6 : 12,
        transition: "width 380ms cubic-bezier(.2,.8,.2,1), background 300ms, padding 260ms",
        background:
          "linear-gradient(180deg, rgba(18,77,34,0.95), rgba(58,130,67,0.95))",
        color: "#eaf6ea",
      }}
    >
      <style>{`
        .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 6px 6px; border-radius: 8px; }
        .sidebar-item:hover { background: rgba(255,255,255,0.03); }
        .sidebar-icon { display: inline-flex; align-items: center; justify-content: center; width:28px; }
        .sidebar-label { transition: opacity 180ms; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; max-width: 140px; }
        .collapsed .sidebar-item { justify-content: center; gap: 0; padding-left: 0; }
      `}</style>
      <button
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={() => setCollapsed((s) => !s)}
        className="absolute top-6 flex items-center justify-center"
        style={{
          height: 48,
          width: 48,
          right: -22,
          zIndex: 80,
          borderRadius: 9999,
          background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 10px 30px rgba(2,6,23,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(6px)",
        }}
      >
        <span style={{width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center'}}>
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-white" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-white" />
          )}
        </span>
      </button>
      <nav className="flex flex-col gap-3 mt-8 text-lg">
        <NavLink
          to="/dashboard"
          title={collapsed ? "Dashboard" : undefined}
          className={({ isActive }) =>
            `sidebar-item ${collapsed ? "justify-center" : ""} ${
              isActive
                ? `text-white font-medium ${collapsed ? "" : "pl-3 border-l-4 border-white/30"}`
                : "text-white/90"
            }`
          }
        >
          <span className="sidebar-icon"><Home className="w-5 h-5 opacity-95" /></span>
          <span className={`sidebar-label ${collapsed ? "opacity-0 hidden" : "opacity-100"}`}>Dashboard</span>
        </NavLink>

        <NavLink
          to="/e-wallet"
          title={collapsed ? "E-wallet" : undefined}
          className={({ isActive }) =>
            `sidebar-item ${collapsed ? "justify-center" : ""} ${
              isActive
                ? `text-white font-medium ${collapsed ? "" : "pl-3 border-l-4 border-white/30"}`
                : "text-white/90"
            }`
          }
        >
          <span className="sidebar-icon"><Wallet className="w-5 h-5 opacity-95" /></span>
          <span className={`sidebar-label ${collapsed ? "opacity-0 hidden" : "opacity-100"}`}>E-wallet</span>
        </NavLink>

        <NavLink
          to="/set-goals"
          title={collapsed ? "Set goals" : undefined}
          className={({ isActive }) =>
            `sidebar-item ${collapsed ? "justify-center" : ""} ${
              isActive
                ? `text-white font-medium ${collapsed ? "" : "pl-3 border-l-4 border-white/30"}`
                : "text-white/90"
            }`
          }
        >
          <span className="sidebar-icon"><Target className="w-5 h-5 opacity-95" /></span>
          <span className={`sidebar-label ${collapsed ? "opacity-0 hidden" : "opacity-100"}`}>Set goals</span>
        </NavLink>

        <NavLink
          to="/history"
          title={collapsed ? "History" : undefined}
          className={({ isActive }) =>
            `sidebar-item ${collapsed ? "justify-center" : ""} ${
              isActive
                ? `text-white font-medium ${collapsed ? "" : "pl-3 border-l-4 border-white/30"}`
                : "text-white/90"
            }`
          }
        >
          <span className="sidebar-icon"><Clock className="w-5 h-5 opacity-95" /></span>
          <span className={`sidebar-label ${collapsed ? "opacity-0 hidden" : "opacity-100"}`}>History</span>
        </NavLink>

        <NavLink
          to="/report"
          title={collapsed ? "Report" : undefined}
          className={({ isActive }) =>
            `sidebar-item ${collapsed ? "justify-center" : ""} ${
              isActive
                ? `text-white font-medium ${collapsed ? "" : "pl-3 border-l-4 border-white/30"}`
                : "text-white/90"
            }`
          }
        >
          <span className="sidebar-icon"><BarChart className="w-5 h-5 opacity-95" /></span>
          <span className={`sidebar-label ${collapsed ? "opacity-0 hidden" : "opacity-100"}`}>Report</span>
        </NavLink>
      </nav>

      <button
        onClick={handleLogout}
        title={collapsed ? "Log out" : undefined}
        className="flex items-center gap-3 text-white/90 hover:opacity-95 transition-opacity mb-4 group sidebar-item"
      >
        <span className="sidebar-icon"><LogOut className="w-6 h-6 transform rotate-180" /></span>
        <span className={`${collapsed ? "opacity-0 hidden" : "text-lg"}`}>Log out</span>
      </button>
    </aside>
  );
}
