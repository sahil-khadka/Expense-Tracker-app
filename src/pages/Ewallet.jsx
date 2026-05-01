import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../constants/api.js";
import { toast } from "react-toastify";
import {
  AUTH_STORAGE_KEY,
  getToken,
  getUserName,
  clearAuth,
} from "../constants/auth.js";
import Sidebar from "../components/Dashboard/Sidebar";
import UserNavbar from "../components/Dashboard/UserNavbar";
import Income from "../components/Ewallet/Income";
import Expense from "../components/Ewallet/Expense";
import EwalletCard from "../components/Ewallet/EwalletCard";

export default function Ewallet() {
  const [showModal, setShowModal] = useState(false);
  const [isExpense, setIsExpense] = useState(false);

  const openModal = (expense = false) => {
    setIsExpense(expense);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

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

  // state for user and balance
  const [userName, setUserName] = useState("User");
  const [balance, setBalance] = useState("0.00");

  const API_URL = "/viewExpenses";

  const decodeTokenName = (token) => {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1]));
      // prefer explicit userName field if available, then name, then email
      return payload.userName || payload.name || payload.email || null;
    } catch (e) {
      return null;
    }
  };

  const fetchBalance = async () => {
    try {
      const token = getToken();
      const config = { withCredentials: true, headers: {} };
      if (token) config.headers.Authorization = `Bearer ${token}`;
      // Prefer server-sourced wallet document which stores the balance
      try {
        const walletRes = await axios.post("/viewOwnwallet", {}, config);
        const wallet = walletRes?.data?.data || walletRes?.data;
        if (wallet && typeof wallet.balance !== "undefined") {
          setBalance(
            Number(wallet.balance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          );
          return;
        }
      } catch (e) {
        // fall back to computing from transactions below
      }

      // fallback: compute from /viewExpenses if wallet doc not available
      const res = await axios.post(API_URL, {}, config);

      let data = [];
      if (Array.isArray(res?.data)) {
        data = res.data;
      } else if (Array.isArray(res?.data?.data)) {
        data = res.data.data;
      } else if (Array.isArray(res?.data?.expenses)) {
        data = res.data.expenses;
      } else if (Array.isArray(res?.data?.transactions)) {
        data = res.data.transactions;
      } else if (res?.data && typeof res.data === "object") {
        const arrayVal = Object.values(res.data).find((val) =>
          Array.isArray(val),
        );
        if (arrayVal) data = arrayVal;
      }

      if (Array.isArray(data)) {
        let bal = 0;
        data.forEach((it) => {
          const amt = Number(it.amount) || Number(it.total) || 0;
          const t = (it.type || it.transactionType || "").toLowerCase();
          if (t === "expense") bal -= amt;
          else bal += amt;
        });
        // format with commas
        setBalance(
          bal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        );
      }
    } catch (err) {
      console.error("Failed to fetch wallet balance:", err);
    }
  };

  const handleOptimisticUpdate = (type, amount) => {
    setBalance((prev) => {
      // remove commas before parsing
      const numericPrev = parseFloat(prev.replace(/,/g, "")) || 0;
      const updated =
        type === "Income" ? numericPrev + amount : numericPrev - amount;
      return updated.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    });
  };

  useEffect(() => {
    // Require authentication for ewallet data
    const token = getToken();
    if (!token) {
      try {
        const current = window.location.pathname;
        if (current !== "/") navigate("/", { replace: true });
      } catch (e) {
        navigate("/", { replace: true });
      }
      return;
    }

    // set user name from token if available and fetch initial balance
    const storedName = getUserName();
    if (storedName) setUserName(storedName);
    else {
      const name = decodeTokenName(token);
      if (name) setUserName(name);
    }
    fetchBalance();
  }, []);

  return (
    <div
      className="min-h-screen text-gray-900 font-sans flex flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #ffffff 0%, #fdfdfd 100%, #ffffff 100%)",
      }}
    >
      <UserNavbar />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Content Area */}
        <main
          className="flex-1 relative overflow-y-auto pb-20 ml-64 pt-16"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(8,42,22,0.12))",
          }}
        >
          <div className="p-10 w-full max-w-full">
            <h1 className="text-4xl font-bold text-[#083b22] mb-6">E-wallet</h1>

            <div className="w-full">
              <EwalletCard name={userName} balance={balance} />

              {/* Buttons: centered, larger, two-column grid */}
              <div className="mt-6 w-full max-w-3xl mx-auto">
                <div className="grid grid-cols-2 gap-6">
                  <button
                    className="ewallet-btn"
                    onClick={() => openModal(false)}
                  >
                    Income
                  </button>
                  <button
                    className="ewallet-btn"
                    onClick={() => openModal(true)}
                  >
                    Expense
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal components */}
          <Income
            show={showModal && !isExpense}
            onClose={closeModal}
            onSaved={fetchBalance}
            onOptimisticSave={(amount) =>
              handleOptimisticUpdate("Income", amount)
            }
          />
          <Expense
            show={showModal && isExpense}
            onClose={closeModal}
            onSaved={fetchBalance}
            onOptimisticSave={(amount) =>
              handleOptimisticUpdate("Expense", amount)
            }
          />
        </main>
      </div>
    </div>
  );
}
