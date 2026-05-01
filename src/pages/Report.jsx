import React from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../constants/api.js";
import { toast } from "react-toastify";
import { clearAuth } from "../constants/auth.js";
import Sidebar from "../components/Dashboard/Sidebar";
import UserNavbar from "../components/Dashboard/UserNavbar";

export default function Report() {
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
            <h1 className="text-4xl font-bold text-gray-800">Report</h1>
            <div className="mt-8">
              <p className="text-gray-600 mb-4">Download your monthly report (PDF)</p>
              <div className="flex gap-4">
                <button
                  onClick={async () => {
                    try {
                      const res = await axios.get("/download", {
                        withCredentials: true,
                        responseType: "blob",
                      });
                      const blob = new Blob([res.data], { type: "application/pdf" });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `Report_${new Date().toISOString().slice(0, 10)}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast("Report download started", { type: "success" });
                    } catch (e) {
                      console.error("Failed to download report:", e);
                      toast("Failed to download report", { type: "error" });
                    }
                  }}
                  className="px-6 py-3 bg-[#0f6f2a] text-white rounded-lg shadow"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
