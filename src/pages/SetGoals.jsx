import React from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../constants/api.js";
import { toast } from "react-toastify";
import { clearAuth } from "../constants/auth.js";
import Sidebar from "../components/Dashboard/Sidebar";
import UserNavbar from "../components/Dashboard/UserNavbar";

export default function SetGoals() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("/logout", {}, { withCredentials: true });
      toast("You have logged out successfully", {
        type: "success",
        autoClose: 1500,
      });
    } finally {
      clearAuth();
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#dce7d7] text-gray-800 font-sans flex flex-col overflow-hidden">
      <UserNavbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main
          className="flex-1 bg-white relative overflow-y-auto pb-20 pt-16"
          style={{ marginLeft: "var(--sidebar-width, 256px)" }}
        >
          <div className="p-10 max-w-[1100px]">
            <h1 className="text-4xl font-bold text-gray-800">Set goals</h1>
          </div>
        </main>
      </div>
    </div>
  );
}
