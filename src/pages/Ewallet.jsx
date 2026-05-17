import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../constants/api.js";
import { getToken, getUserName } from "../constants/auth.js";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Lightbulb,
  PiggyBank,
} from "lucide-react";
import Sidebar from "../components/Dashboard/Sidebar";
import UserNavbar from "../components/Dashboard/UserNavbar";
import Income from "../components/Ewallet/Income";
import Expense from "../components/Ewallet/Expense";
import EwalletCard from "../components/Ewallet/EwalletCard";

const decodeTokenName = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.userName || payload.username || payload.name || null;
  } catch {
    return null;
  }
};

const getInitialUserName = () => {
  const storedName = getUserName();
  if (storedName) return storedName;

  const token = getToken();
  if (!token) return "User";

  return decodeTokenName(token) || "User";
};

export default function Ewallet() {
  const [showModal, setShowModal] = useState(false);
  const [isExpense, setIsExpense] = useState(false);

  const openModal = (expense = false) => {
    setIsExpense(expense);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const navigate = useNavigate();

  const [userName, setUserName] = useState(() => getInitialUserName());
  const [balance, setBalance] = useState("0.00");

  const API_URL = "/viewExpenses";

  const fetchBalance = async () => {
    try {
      const token = getToken();
      const config = { withCredentials: true, headers: {} };

      if (token) config.headers.Authorization = `Bearer ${token}`;

      let hasWalletBalance = false;

      try {
        const walletRes = await axios.post("/viewOwnwallet", {}, config);
        const wallet = walletRes?.data?.data || walletRes?.data;
        const walletUserName = wallet?.userID?.userName;

        if (walletUserName) setUserName(walletUserName);

        if (wallet && typeof wallet.balance !== "undefined") {
          setBalance(
            Number(wallet.balance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          );
          hasWalletBalance = true;
        }
      } catch {
        hasWalletBalance = false;
      }

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
        const norm = data
          .map((it) => ({
            date: it.Date || it.date || it.createdAt || "",
            category: it.category || it.categoryName || "Other",
            type: it.type || it.transactionType || "",
            amount: Number(it.amount) || Number(it.total) || 0,
          }))
          .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        let bal = 0;

        norm.forEach((it) => {
          const amt = Number(it.amount) || 0;
          const t = String(it.type || "").toLowerCase();

          if (t === "expense") bal -= amt;
          else bal += amt;
        });

        if (!hasWalletBalance) {
          setBalance(
            bal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          );
        }
      }
    } catch (err) {
      console.error("Failed to fetch wallet balance:", err);
    }
  };

  const handleOptimisticUpdate = (type, amount) => {
    setBalance((prev) => {
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
    const token = getToken();

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    const timer = window.setTimeout(() => {
      fetchBalance();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  const displayUserName = String(userName || "User").includes("@")
    ? String(userName).split("@")[0]
    : userName;

  const numericBalance = Number(String(balance).replace(/,/g, "")) || 0;
  const reserveAmount = Math.max(0, numericBalance * 0.2);
  const spendableAmount = Math.max(0, numericBalance - reserveAmount);

  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const remainingDays = Math.max(
    1,
    lastDayOfMonth.getDate() - today.getDate() + 1,
  );

  const suggestedDailyBudget = spendableAmount / remainingDays;

  const suggestionItems = [
    numericBalance <= 0
      ? "Your wallet is empty. Add an income entry before making any expense."
      : numericBalance < 500
        ? "Your balance is low. Prefer essential spending only for now."
        : "Your balance is stable. Keep tracking each expense to stay in control.",
    `Try keeping at least Rs. ${reserveAmount.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })} as emergency reserve.`,
    "Review your History page timely and edit wrong entries quickly.",
  ];

  return (
    <div className="min-h-screen text-gray-900 font-sans flex flex-col overflow-hidden">
      <UserNavbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main
          className="flex-1 relative overflow-y-auto pb-20 pt-16"
          style={{
            marginLeft: "var(--sidebar-width, 256px)",
            background: "transparent",
          }}
        >
          <div className="p-8 lg:p-10 w-full max-w-full">
            <h1 className="text-4xl font-bold text-[#083b22] mb-6">E-wallet</h1>

            <div className="w-full">
              <EwalletCard name={displayUserName} balance={balance} />

              {/* Action Buttons */}
              <div className="mt-6 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <button
                    className="text-left rounded-2xl p-5 shadow-md border border-emerald-100 bg-gradient-to-r from-emerald-100 to-emerald-200 hover:from-emerald-200 hover:to-emerald-300 transition"
                    onClick={() => openModal(false)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">
                          Add Money
                        </p>
                        <p className="text-xl font-bold text-emerald-900 mt-1">
                          Income
                        </p>
                        <p className="text-sm text-emerald-800/80 mt-1">
                          Record salary, bonus or other deposits.
                        </p>
                      </div>
                      <ArrowUpRight className="w-8 h-8 text-emerald-700" />
                    </div>
                  </button>

                  <button
                    className="text-left rounded-2xl p-5 shadow-md border border-rose-100 bg-gradient-to-r from-rose-50 to-rose-100 hover:from-rose-100 hover:to-rose-200 transition"
                    onClick={() => openModal(true)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-rose-700 font-semibold">
                          Spend Money
                        </p>
                        <p className="text-xl font-bold text-rose-900 mt-1">
                          Expense
                        </p>
                        <p className="text-sm text-rose-800/80 mt-1">
                          Track bills, shopping and daily spending.
                        </p>
                      </div>
                      <ArrowDownRight className="w-8 h-8 text-rose-700" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Bottom cards */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Smart Budget Planner */}
                <div className="bg-emerald-50 rounded-2xl shadow-md p-5 border border-transparent">
                  <h3 className="text-lg font-semibold text-[#0b3c24] mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-700" />
                    Smart Budget Planner
                  </h3>

                  <p className="text-sm text-gray-700 mb-4">
                    Suggested plan from your current wallet balance to avoid
                    overspending before month-end.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-transparent bg-emerald-100 p-4">
                      <p className="text-[11px] text-blue-700 font-semibold uppercase tracking-wide">
                        Spendable Now
                      </p>
                      <p className="text-lg font-bold text-blue-900 mt-1 leading-tight">
                        Rs.{" "}
                        {spendableAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    <div className="rounded-xl border border-transparent bg-emerald-100 p-4">
                      <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide flex items-center gap-1">
                        <PiggyBank className="w-3 h-3" />
                        Keep as Reserve
                      </p>
                      <p className="text-lg font-bold text-emerald-900 mt-1 leading-tight">
                        Rs.{" "}
                        {reserveAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    <div className="rounded-xl border border-transparent bg-emerald-100 p-4">
                      <p className="text-[11px] text-amber-700 font-semibold uppercase tracking-wide">
                        Daily Limit
                      </p>
                      <p className="text-lg font-bold text-amber-900 mt-1 leading-tight">
                        Rs.{" "}
                        {suggestedDailyBudget.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        for next {remainingDays} day(s)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-emerald-100 border border-transparent px-4 py-3 text-sm text-gray-700">
                    Tip: Keep at least 20% as reserve for unexpected expenses.
                  </div>
                </div>

                {/* Suggestions */}
                <div className="bg-emerald-50 rounded-2xl shadow-md p-5 border border-transparent">
                  <h3 className="text-lg font-semibold text-[#0b3c24] mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    Suggestions For You
                  </h3>

                  <ul className="space-y-3 text-sm text-gray-700">
                    {suggestionItems.map((item, idx) => (
                      <li
                        key={idx}
                        className="rounded-lg border border-transparent bg-emerald-100 px-3 py-2"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Modals */}
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
            availableBalance={numericBalance}
          />
        </main>
      </div>
    </div>
  );
}
  
