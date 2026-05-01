import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../constants/api.js";
import { toast } from "react-toastify";
import { getToken, getUserName, clearAuth } from "../constants/auth.js";
import WeeklyActivity from "../components/Dashboard/WeeklyActivity";
import ExpenseStatistics from "../components/Dashboard/ExpenseStatistics";
import MyCard from "../components/Dashboard/MyCard";
import Sidebar from "../components/Dashboard/Sidebar";
import UserNavbar from "../components/Dashboard/UserNavbar";
import {
  LogOut,
  MessageCircle,
  Hand,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Sparkles,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";

/* ─── helpers ─────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { label: "Good Morning", Icon: Sun };
  if (h < 17) return { label: "Good Afternoon", Icon: Sunset };
  return { label: "Good Evening", Icon: Moon };
}

function formatDateLocal(d) {
  try {
    if (!d) return "";
    const isoOnly = /^\d{4}-\d{2}-\d{2}$/;
    let dt;
    if (typeof d === "string" && isoOnly.test(d)) {
      const [y, m, day] = d.split("-").map(Number);
      dt = new Date(y, m - 1, day);
    } else {
      dt = new Date(d);
    }
    return dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function fmt(n) {
  const value = Number(n);
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ─── StatCard ─────────────────────────────────────── */
function StatCard({ label, value, sub, up, color }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        borderLeft: `4px solid ${color}`,
        flex: 1,
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>Rs. {fmt(value)}</span>
      <span style={{ fontSize: 12, color: up ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: 4 }}>
        {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {sub}
      </span>
    </div>
  );
}

/* ─── Dashboard ────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const [expenseStats, setExpenseStats] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [userName, setUserName] = useState("User");
  const [walletBalance, setWalletBalance] = useState("0.00");
  const [transactions, setTransactions] = useState([]);
  const [serverOnline, setServerOnline] = useState(true);
  const [barData, setBarData] = useState(null);
  const { label: greetLabel, Icon: GreetIcon } = getGreeting();

  /* ── data fetching (unchanged logic) ── */
  useEffect(() => {
    const fetchExpenseStats = async () => {
      try {
        const res = await axios.get("/filterPieChart?filter=monthly", { withCredentials: true });
        setServerOnline(true);
        const payload = res?.data?.data || res?.data;
        const agg = payload?.AggregationResult || payload?.Aggregation || [];
        if (Array.isArray(agg)) {
          const statsArray = agg.map((it) => ({
            category: it._id || it.category || it.categoryName || "Other",
            amount: it.total || it.amount || 0,
          }));
          const total = payload?.totalExpense || statsArray.reduce((s, i) => s + (i.amount || 0), 0);
          statsArray.sort((a, b) => b.amount - a.amount);
          setExpenseStats(statsArray);
          setTotalExpense(total);
        }
      } catch {
        setServerOnline(false);
      }
    };

    const fetchMonthlySummary = async () => {
      try {
        const res = await axios.get("/monthlySummary", { withCredentials: true });
        setServerOnline(true);
        const payload = res?.data?.data || {};
        const income = Number(payload?.totalIncome);
        const expense = Number(payload?.totalExpense);
        const balance = Number(payload?.walletBalance);

        if (Number.isFinite(income)) setTotalIncome(income);
        if (Number.isFinite(expense)) setTotalExpense(expense);
        if (Number.isFinite(balance)) setWalletBalance(balance);
      } catch {
        setServerOnline(false);
      }
    };

    const fetchBarData = async () => {
      try {
        const res = await axios.get("/filterBarchart", { withCredentials: true });
        setServerOnline(true);
        setBarData(res?.data?.data || res?.data || null);
      } catch {
        setServerOnline(false);
      }
    };

    const fetchWallet = async () => {
      try {
        const token = getToken();
        const config = { withCredentials: true, headers: token ? { Authorization: `Bearer ${token}` } : {} };

        try {
          const walletRes = await axios.post("/viewOwnwallet", {}, config);
          const walletData = walletRes?.data?.data || {};
          const balanceCandidates = [
            walletData?.balance,
            walletData?.walletBalance,
            walletRes?.data?.balance,
            walletRes?.data?.walletBalance,
          ];
          const parsedBalance =
            balanceCandidates
              .map((val) => Number(val))
              .find((val) => Number.isFinite(val)) ?? 0;
          setWalletBalance(parsedBalance);
          const rawName = walletData?.userID?.userName || walletRes?.data?.userName;
          if (rawName) setUserName(rawName);
        } catch {}

        const res = await axios.post("/viewExpenses", {}, config);
        let data = [];
        if (Array.isArray(res?.data)) data = res.data;
        else if (Array.isArray(res?.data?.data)) data = res.data.data;
        else if (Array.isArray(res?.data?.expenses)) data = res.data.expenses;
        else if (Array.isArray(res?.data?.transactions)) data = res.data.transactions;
        else {
          const v = Object.values(res?.data || {}).find(Array.isArray);
          if (v) data = v;
        }

        const norm = data.map((it) => ({
          date: it.Date || it.date || it.createdAt || "",
          category: it.category || it.categoryName || "",
          type: it.type || it.transactionType || "",
          amount: Number(it.amount) || Number(it.total) || 0,
        }))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        setTransactions(norm);

        try {
          if (token) {
            const parts = token.split(".");
            if (parts.length >= 2) {
              const p = JSON.parse(atob(parts[1]));
              const n = p.name || p.userName;
              if (n) setUserName(n);
            }
          }
        } catch {}
      } catch {
        setServerOnline(false);
      }
    };

    const storedName = getUserName();
    if (storedName) setUserName(storedName);
    fetchExpenseStats();
    fetchMonthlySummary();
    fetchBarData();
    fetchWallet();
  }, []);

  /* ── pie data ── */
  const pieColors = ["#16a34a", "#eab308", "#3b82f6", "#ef4444", "#a855f7", "#ec4899", "#f97316"];
  let acc = 0;
  const gradientStops = expenseStats
    .map((s, i) => {
      const start = acc;
      const pct = (s.amount / (totalExpense || 1)) * 100;
      acc += pct;
      return `${pieColors[i % pieColors.length]} ${start}% ${acc}%`;
    })
    .join(", ");

  const pieBackground =
    expenseStats.length > 0 && totalExpense > 0
      ? `conic-gradient(${gradientStops})`
      : "conic-gradient(#e5e7eb 0% 100%)";

  let accSlice = 0;
  const slices = expenseStats.map((stat, idx) => {
    const pct = (stat.amount / (totalExpense || 1)) * 100;
    const mid = accSlice + pct / 2;
    accSlice += pct;
    const angle = (mid / 100) * 2 * Math.PI - Math.PI / 2 - (45 * Math.PI) / 180;
    return { ...stat, percentage: pct, x: Math.cos(angle) * 67, y: Math.sin(angle) * 67, color: pieColors[idx % pieColors.length] };
  });

  const handleLogout = async () => {
    try {
      await axios.post("/logout", {}, { withCredentials: true });
      toast("Logged out successfully", { type: "success", autoClose: 1500 });
    } finally {
      clearAuth();
      navigate("/");
    }
  };

  /* ── styles ── */
  const S = {
    page: {
      minHeight: "100vh",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: "linear-gradient(160deg, #e8f5ec 0%, #c8e6d0 40%, #6ab87a 80%, #2d7a3a 100%)",
      display: "flex",
      flexDirection: "column",
    },
    layout: { display: "flex", flex: 1, overflow: "hidden" },
    main: {
      flex: 1,
      marginLeft: "var(--sidebar-width, 256px)",
      paddingTop: 64,
      background: "#f8faf9",
      overflowY: "auto",
      paddingBottom: 80,
    },
    inner: { padding: "32px 36px", maxWidth: 1400, margin: "0 auto" },

    /* greeting */
    greetBanner: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 28,
    },
    greetLeft: { display: "flex", alignItems: "center", gap: 14 },
    greetIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      background: "linear-gradient(135deg,#16a34a,#22c55e)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 14px rgba(22,163,74,0.35)",
    },
    greetTitle: { fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 },
    greetSub: { fontSize: 13, color: "#6b7280", margin: 0 },
    greetDate: {
      fontSize: 13,
      color: "#374151",
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      padding: "6px 14px",
      fontWeight: 500,
    },

    /* stat strip */
    statRow: { display: "flex", gap: 16, marginBottom: 28 },

    /* section title */
    sectionTitle: { fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 14, letterSpacing: "-0.01em" },

    /* top row */
    topRow: { display: "grid", gridTemplateColumns: "1fr 1.45fr", gap: 24, marginBottom: 28, alignItems: "start" },

    /* card shell */
    card: {
      background: "#fff",
      borderRadius: 20,
      boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
      overflow: "hidden",
    },

    /* my card gradient */
    myCardGrad: {
      background: "linear-gradient(135deg,#166534,#16a34a,#22c55e)",
      borderRadius: 20,
      padding: "28px 28px 24px",
      color: "#fff",
      position: "relative",
      overflow: "hidden",
      minHeight: 190,
    },

    /* txn list */
    txnHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "18px 22px 10px",
      borderBottom: "1px solid #f3f4f6",
    },
    txnItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "13px 22px",
      borderBottom: "1px solid #f9fafb",
      transition: "background 0.15s",
    },
    txnIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 11,
      background: "#f0fdf4",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
      flexShrink: 0,
    },

    /* charts row */
    chartsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
    chartCard: {
      background: "#fff",
      borderRadius: 20,
      boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
      padding: "22px 24px",
    },
  };

  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={S.page}>
      <UserNavbar />

      {!serverOnline && (
        <div style={{ background: "#dc2626", color: "#fff", textAlign: "center", padding: "8px 16px", fontSize: 13 }}>
          ⚠ Server unreachable — check backend.{" "}
          <button onClick={() => window.location.reload()} style={{ textDecoration: "underline", background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
            Retry
          </button>
        </div>
      )}

      <div style={S.layout}>
        <Sidebar />

        <main style={S.main}>
          <div style={S.inner}>

            {/* ── Greeting Banner ── */}
            <div style={S.greetBanner}>
              <div style={S.greetLeft}>
                <div style={S.greetIconWrap}>
                  <GreetIcon size={22} color="#fff" />
                </div>
                <div>
                  <p style={S.greetTitle}>
                    {greetLabel},{" "}
                    <span style={{ color: "#16a34a" }}>
                      {String(userName).charAt(0).toUpperCase() + String(userName).slice(1)}
                    </span>{" "}
                   
                  </p>
                  <p style={S.greetSub}>Here's your financial overview for this month.</p>
                </div>
              </div>
              <span style={S.greetDate}>{todayStr}</span>
            </div>

            {/* ── Stat Strip ── */}
            <div style={S.statRow}>
              <StatCard label="Wallet Balance" value={walletBalance} sub="Current balance" up={true} color="#16a34a" />
              <StatCard label="Total Income" value={totalIncome} sub="This month" up={true} color="#3b82f6" />
              <StatCard label="Total Expenses" value={totalExpense} sub="This month" up={false} color="#ef4444" />
              <StatCard label="Net Savings" value={Math.max(0, totalIncome - totalExpense)} sub="Income − Expenses" up={totalIncome >= totalExpense} color="#a855f7" />
            </div>

            {/* ── Top Row: Card + Transactions ── */}
            <div style={S.topRow}>

              {/* My Card */}
              <div>
                <p style={S.sectionTitle}>My Card</p>
                <div style={S.myCardGrad}>
                  {/* decorative circles */}
                  <div style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
                  <div style={{ position: "absolute", bottom: -20, right: 40, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                    <div>
                      <p style={{ fontSize: 11, opacity: 0.7, margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Available Balance</p>
                      <p style={{ fontSize: 28, fontWeight: 800, margin: "4px 0 0", letterSpacing: "-0.02em" }}>
                        Rs. {fmt(walletBalance)}
                      </p>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "6px 10px", fontSize: 11, fontWeight: 600, backdropFilter: "blur(4px)" }}>
                      ACTIVE
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, opacity: 0.6, margin: "0 0 2px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Card Holder</p>
                    <p style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                      {String(userName).charAt(0).toUpperCase() + String(userName).slice(1)}
                    </p>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: 11, opacity: 0.6, margin: "0 0 2px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Card Number</p>
                      <p style={{ fontSize: 14, fontWeight: 600, margin: 0, letterSpacing: "0.12em" }}>
                        08923 ******* 1267
                      </p>
                    </div>
                    <div style={{ display: "flex" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,200,0,0.7)", marginRight: -10 }} />
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,100,0,0.7)" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <p style={{ ...S.sectionTitle, marginBottom: 0 }}>Recent Transactions</p>
                  <Link to="/history" style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                    View All <ArrowUpRight size={13} />
                  </Link>
                </div>
                <div style={S.card}>
                  {transactions.length === 0 ? (
                    <div style={{ padding: "32px 22px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No transactions yet.</div>
                  ) : (
                    transactions.slice(0, 3).map((item, i) => {
                      const isExp = String(item.type || "").toLowerCase() === "expense";
                      return (
                        <div
                          key={i}
                          style={{
                            ...S.txnItem,
                            borderBottom: i < Math.min(transactions.length, 3) - 1 ? "1px solid #f3f4f6" : "none",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <div style={{ ...S.txnIconWrap, background: isExp ? "#fef2f2" : "#f0fdf4" }}>
                              {isExp ? <TrendingDown size={17} color="#dc2626" /> : <TrendingUp size={17} color="#16a34a" />}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#111827" }}>{item.category || "—"}</p>
                              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{formatDateLocal(item.date)}</p>
                            </div>
                          </div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: isExp ? "#dc2626" : "#16a34a" }}>
                            {isExp ? "−" : "+"}Rs. {fmt(item.amount)}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ── Charts Row ── */}
            <div style={S.chartsRow}>
              {/* Weekly Activity */}
              <div>
                <p style={S.sectionTitle}>Weekly Activity</p>
                <div style={S.chartCard}>
                  <WeeklyActivity transactions={transactions} barData={barData} />
                </div>
              </div>

              {/* Expense Statistics */}
              <div>
                <p style={S.sectionTitle}>Expense Statistics</p>
                <div style={S.chartCard}>
                  <ExpenseStatistics
                    expenseStats={expenseStats}
                    totalExpense={totalExpense}
                    pieBackground={pieBackground}
                    slices={slices}
                    transactions={transactions}
                  />
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Floating Chat */}
      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 20, padding: "6px 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", fontSize: 12, fontWeight: 600, color: "#374151" }}>
          <Sparkles size={13} color="#16a34a" /> We are here to help!
        </div>
        <button
          style={{
            background: "linear-gradient(135deg,#16a34a,#22c55e)",
            border: "none",
            borderRadius: "50%",
            width: 52,
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(22,163,74,0.4)",
          }}
        >
          <MessageCircle size={24} color="#fff" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}