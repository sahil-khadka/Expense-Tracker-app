import React, { useState, useEffect } from "react";
import axios from "../constants/api.js";
import { toast } from "react-toastify";
import { getToken } from "../constants/auth.js";
import Sidebar from "../components/Dashboard/Sidebar";
import UserNavbar from "../components/Dashboard/UserNavbar";
import {
  Target,
  Plus,
  Trash2,
  Pencil,
  PiggyBank,
  TrendingUp,
  X,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  Eye,
} from "lucide-react";
import confetti from "canvas-confetti";

// ── Constants ──────────────────────────────────────────────
const GOALS_PER_PAGE = 6;
const PRIORITY_ORDER = { high: 1, medium: 2, low: 3 };
const PRIORITY_STYLES = {
  high: "bg-red-100 text-red-700 border border-red-200",
  medium: "bg-amber-100 text-amber-700 border border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};
const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d8753]/30 focus:border-[#3d8753] transition-all";
const btnPrimary =
  "flex-1 py-2.5 rounded-xl bg-[#3d8753] text-white text-sm font-semibold hover:bg-[#245534] transition-colors disabled:opacity-60";
const btnSecondary =
  "flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors";

// ── Confetti — drops from the very top of the screen ──────
const launchConfetti = () => {
  const colors = [
    "#2d6a3f",
    "#52a067",
    "#f59e0b",
    "#3b82f6",
    "#ec4899",
    "#2e83b5",
  ];

  // first wave - all 3 positions at once
  confetti({
    particleCount: 50,
    angle: 60,
    spread: 70,
    origin: { x: 0, y: 0 },
    colors,
    gravity: 1,
    scalar: 1.8,
    drift: 0.5,
    ticks: 250,
  });

  confetti({
    particleCount: 60,
    angle: 90,
    spread: 100,
    origin: { x: 0.5, y: 0 },
    colors,
    gravity: 1,
    scalar: 1.8,
    drift: 0,
    ticks: 250,
  });

  confetti({
    particleCount: 50,
    angle: 120,
    spread: 70,
    origin: { x: 1, y: 0 },
    colors,
    gravity: 1,
    scalar: 1.8,
    drift: -0.5,
    ticks: 250,
  });

  // second wave at 0.8s
  setTimeout(() => {
    confetti({
      particleCount: 25,
      angle: 90,
      spread: 120,
      origin: { x: 0.5, y: 0 },
      colors,
      gravity: 1,
      scalar: 2,
      ticks: 250,
    });
  }, 800);

  // third wave at 1.6s
  setTimeout(() => {
    confetti({
      particleCount: 20,
      angle: 60,
      spread: 80,
      origin: { x: 0.2, y: 0 },
      colors,
      gravity: 1,
      scalar: 1.8,
      ticks: 250,
    });
    confetti({
      particleCount: 20,
      angle: 120,
      spread: 80,
      origin: { x: 0.8, y: 0 },
      colors,
      gravity: 1,
      scalar: 1.8,
      ticks: 250,
    });
  }, 0);
};

// ── Small reusable components ──────────────────────────────
const PriorityBadge = ({ priority }) => (
  <span
    className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${PRIORITY_STYLES[priority]}`}
  >
    {priority}
  </span>
);

const ProgressBar = ({ pct }) => {
  const color =
    pct >= 100
      ? "bg-emerald-500"
      : pct >= 60
        ? "bg-blue-500"
        : pct >= 30
          ? "bg-amber-500"
          : "bg-rose-400";
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

const PrioritySelect = ({ value, onChange }) => (
  <Field label="Priority">
    <select className={inputCls} value={value} onChange={onChange}>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
  </Field>
);

const ModalButtons = ({ onCancel, submitting, label, color = btnPrimary }) => (
  <div className="flex gap-3 pt-2">
    <button type="button" onClick={onCancel} className={btnSecondary}>
      Cancel
    </button>
    <button type="submit" disabled={submitting} className={color}>
      {submitting ? "Please wait..." : label}
    </button>
  </div>
);

const Pagination = ({ page, total, perPage, onChange }) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${p === page ? "bg-[#3d8753] text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === Math.ceil(total / perPage)}
        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ── Goal Card ──────────────────────────────────────────────
const GoalCard = ({ goal, onDeposit, onEdit, onDelete }) => {
  const pct = parseFloat(goal.progressPercentage) || 0;
  const isComplete = pct >= 100;
  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000)
    : null;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-2 p-5 flex flex-col gap-4 hover:shadow-md transition-all ${
        isComplete ? "border-emerald-300" : "border-emerald-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isComplete ? "bg-emerald-100" : "bg-[#eaf3e8]"}`}
          >
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <Target className="w-5 h-5 text-[#3d8753]" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">
              {goal.goalName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <PriorityBadge priority={goal.priority} />
              {isComplete && (
                <span className="text-[11px] font-semibold text-emerald-600 uppercase">
                  Completed
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isComplete && (
            <button
              onClick={() => onEdit(goal)}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(goal)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-500">Progress</span>
          <span className="text-xs font-bold text-gray-700">
            {goal.progressPercentage}
          </span>
        </div>
        <ProgressBar pct={pct} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Saved", value: goal.savedAmount, cls: "text-emerald-700" },
          { label: "Target", value: goal.targetAmount, cls: "text-gray-700" },
          { label: "Left", value: goal.remainingAmount, cls: "text-rose-600" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
              {label}
            </p>
            <p className={`text-sm font-bold ${cls}`}>
              Rs.{Number(value).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        {daysLeft !== null ? (
          <div
            className={`flex items-center gap-1.5 text-xs ${daysLeft <= 7 ? "text-red-500" : daysLeft <= 30 ? "text-amber-600" : "text-gray-400"}`}
          >
            {daysLeft <= 7 ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            {daysLeft > 0 ? `${daysLeft} days left` : "Deadline passed"}
          </div>
        ) : (
          <span />
        )}
        {!isComplete && (
          <button
            onClick={() => onDeposit(goal)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3d8753] text-white rounded-lg text-xs font-semibold hover:bg-[#245534] transition-colors"
          >
            <Wallet className="w-3.5 h-3.5" /> Add Saving
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────
export default function SetGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Search, Sort & View filter
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("priority");
  const [sortDir, setSortDir] = useState("asc");
  const [showCompleted, setShowCompleted] = useState(false); // ← toggle completed visibility

  const [createForm, setCreateForm] = useState({
    goalName: "",
    targetAmount: "",
    priority: "medium",
    deadline: "",
  });
  const [editForm, setEditForm] = useState({
    goalName: "",
    targetAmount: "",
    priority: "medium",
  });
  const [depositForm, setDepositForm] = useState({
    amount: "",
    account: "Bank",
    note: "",
  });

  const authConfig = () => {
    const token = getToken();
    return {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  };

  const fetchGoals = async () => {
    try {
      const res = await axios.get("/goals", authConfig());
      // Sort newest first so the most recently created goal appears at the top
      const data = (res?.data?.data || [])
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setGoals(data);
    } catch {
      toast.error("Failed to fetch goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // ── Filter + Sort ──────────────────────────────────────
  const processed = goals
    .filter((g) => {
      const isComplete = parseFloat(g.progressPercentage) >= 100;
      // hide completed goals unless user chose to show them
      if (isComplete && !showCompleted) return false;
      return g.goalName.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      let valA, valB;
      if (sortBy === "priority") {
        valA = PRIORITY_ORDER[a.priority];
        valB = PRIORITY_ORDER[b.priority];
      } else if (sortBy === "name") {
        valA = a.goalName.toLowerCase();
        valB = b.goalName.toLowerCase();
      } else if (sortBy === "progress") {
        valA = parseFloat(a.progressPercentage);
        valB = parseFloat(b.progressPercentage);
      } else if (sortBy === "deadline") {
        valA = new Date(a.deadline || 0);
        valB = new Date(b.deadline || 0);
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const paginated = processed.slice(
    (page - 1) * GOALS_PER_PAGE,
    page * GOALS_PER_PAGE,
  );

  const totalSaved = goals.reduce((s, g) => s + (g.savedAmount || 0), 0);
  const completedCount = goals.filter(
    (g) => parseFloat(g.progressPercentage) >= 100,
  ).length;

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);

      // Progress should start from highest first
      if (field === "progress") {
        setSortDir("desc");
      } else {
        setSortDir("asc");
      }
    }

    setPage(1);
  };

  const openModal = (type, goal = null) => {
    setModal(type);
    setSelected(goal);
  };
  const closeModal = () => {
    setModal(null);
    setSelected(null);
  };

  // ── API Actions ────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("/save-goal", createForm, authConfig());
      toast.success("Goal created!");
      closeModal();
      setCreateForm({
        goalName: "",
        targetAmount: "",
        priority: "medium",
        deadline: "",
      });
      setPage(1);
      fetchGoals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create goal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`/goals/${selected.id}`, editForm, authConfig());
      toast.success("Goal updated!");
      closeModal();
      fetchGoals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update goal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await axios.delete(`/goals/${selected.id}`, authConfig());
      toast.success(res?.data?.message || "Goal deleted");
      closeModal();
      if (paginated.length === 1 && page > 1) setPage(page - 1);
      fetchGoals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete goal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(
        `/goals/${selected.id}/add-saving`,
        depositForm,
        authConfig(),
      );
      const isCompleted = res?.data?.data?.goal?.isCompleted;
      if (isCompleted) {
        launchConfetti();
        toast.success("Goal completed! Well done!");
      } else {
        toast.success(res?.data?.message || "Saving added!");
      }
      closeModal();
      fetchGoals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add saving");
    } finally {
      setSubmitting(false);
    }
  };

  const SortBtn = ({ field, label }) => {
    const getDirectionLabel = () => {
      if (sortBy !== field) return null;

      if (field === "progress") {
        return (
          <span className="text-[10px]">
            {sortDir === "desc" ? "Highest" : "Lowest"}
          </span>
        );
      }

      return (
        <span className="text-[10px]">{sortDir === "asc" ? "A" : "D"}</span>
      );
    };

    return (
      <button
        onClick={() => toggleSort(field)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
          sortBy === field
            ? "bg-[#3d8753] text-white border-[#3d8753]"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        }`}
      >
        {label}
        <ArrowUpDown className="w-3 h-3" />
        {getDirectionLabel()}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#dce7d7] font-sans flex flex-col overflow-hidden">
      <UserNavbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main
          className="flex-1 bg-white overflow-y-auto pb-20 pt-16"
          style={{ marginLeft: "var(--sidebar-width, 256px)" }}
        >
          <div className="p-8 lg:p-10 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-800">Set Goals</h1>
                <p className="text-gray-500 mt-1 text-sm">
                  Track your savings goals and stay on target
                </p>
              </div>
              <button
                onClick={() => openModal("create")}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#3d8753] text-white rounded-xl font-semibold text-sm hover:bg-[#245534] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> New Goal
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                {
                  icon: <Target className="w-5 h-5 text-white" />,
                  bg: "bg-[#3d8753]",
                  card: "bg-[#eaf3e8]",
                  label: "Total Goals",
                  value: goals.length,
                },
                {
                  icon: <TrendingUp className="w-5 h-5 text-white" />,
                  bg: "bg-blue-500",
                  card: "bg-blue-50",
                  label: "Total Saved",
                  value: `Rs.${totalSaved.toLocaleString()}`,
                },
                {
                  icon: <CheckCircle2 className="w-5 h-5 text-white" />,
                  bg: "bg-emerald-500",
                  card: "bg-emerald-50",
                  label: "Completed",
                  value: `${completedCount} / ${goals.length}`,
                },
              ].map(({ icon, bg, card, label, value }) => (
                <div
                  key={label}
                  className={`${card} rounded-2xl p-5 flex items-center gap-4`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {label}
                    </p>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Search, Sort & Show Completed bar */}
            {goals.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#3d8753]/30 focus:border-[#3d8753] transition-all"
                    placeholder="Search goals..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>

                {/* Sort buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 font-medium">
                    Sort:
                  </span>
                  <SortBtn field="priority" label="Priority" />
                  <SortBtn field="name" label="Name" />
                  <SortBtn field="progress" label="Progress" />
                  <SortBtn field="deadline" label="Deadline" />
                </div>

                {/* Show completed toggle — only shows if there are completed goals */}
                {completedCount > 0 && (
                  <button
                    onClick={() => {
                      setShowCompleted((v) => !v);
                      setPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ml-auto ${
                      showCompleted
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showCompleted
                      ? `Hide Completed (${completedCount})`
                      : `Show Completed (${completedCount})`}
                  </button>
                )}
              </div>
            )}

            {/* Goals grid */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-4 border-[#3d8753] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-[#eaf3e8] flex items-center justify-center mb-5">
                  <PiggyBank className="w-10 h-10 text-[#3d7a3a]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No goals yet
                </h3>
                <p className="text-gray-400 text-sm mb-6 max-w-xs">
                  Set your first financial goal and start tracking your savings
                  progress.
                </p>
                <button
                  onClick={() => openModal("create")}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#3d8753] text-white rounded-xl text-sm font-semibold hover:bg-[#245534] transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create your first goal
                </button>
              </div>
            ) : processed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">
                  {search
                    ? `No goals match "${search}"`
                    : "No active goals. All goals are completed!"}
                </p>
                <div className="flex gap-2 mt-3">
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="text-sm text-[#3d8753] hover:underline font-semibold"
                    >
                      Clear search
                    </button>
                  )}
                  {!showCompleted && completedCount > 0 && (
                    <button
                      onClick={() => setShowCompleted(true)}
                      className="text-sm text-emerald-600 hover:underline font-semibold"
                    >
                      Show completed goals
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div
                  className={`grid gap-5 ${paginated.length === 1 ? "grid-cols-1 max-w-md" : "grid-cols-1 md:grid-cols-3"}`}
                >
                  {paginated.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onDeposit={(g) => {
                        setSelected(g);
                        setDepositForm({
                          amount: "",
                          account: "Bank",
                          note: "",
                        });
                        setModal("deposit");
                      }}
                      onEdit={(g) => {
                        setSelected(g);
                        setEditForm({
                          goalName: g.goalName,
                          targetAmount: g.targetAmount,
                          priority: g.priority,
                        });
                        setModal("edit");
                      }}
                      onDelete={(g) => openModal("delete", g)}
                    />
                  ))}
                </div>
                <Pagination
                  page={page}
                  total={processed.length}
                  perPage={GOALS_PER_PAGE}
                  onChange={setPage}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {/* ── MODALS ────────────────────────────────────────── */}
      {modal === "create" && (
        <Modal title="Create New Goal" onClose={closeModal}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Goal Name">
              <input
                className={inputCls}
                placeholder="e.g. Buy a Laptop"
                value={createForm.goalName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, goalName: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Target Amount (Rs.)">
              <input
                type="number"
                min="1"
                className={inputCls}
                placeholder="e.g. 50000"
                value={createForm.targetAmount}
                onChange={(e) =>
                  setCreateForm({ ...createForm, targetAmount: e.target.value })
                }
                required
              />
            </Field>
            <PrioritySelect
              value={createForm.priority}
              onChange={(e) =>
                setCreateForm({ ...createForm, priority: e.target.value })
              }
            />
            <Field label="Deadline">
              <input
                type="date"
                className={inputCls}
                value={createForm.deadline}
                onChange={(e) =>
                  setCreateForm({ ...createForm, deadline: e.target.value })
                }
                required
              />
            </Field>
            <ModalButtons
              onCancel={closeModal}
              submitting={submitting}
              label="Create Goal"
            />
          </form>
        </Modal>
      )}

      {modal === "edit" && selected && (
        <Modal title={`Edit — ${selected.goalName}`} onClose={closeModal}>
          <form onSubmit={handleEdit} className="space-y-4">
            <Field label="Goal Name">
              <input
                className={inputCls}
                value={editForm.goalName}
                onChange={(e) =>
                  setEditForm({ ...editForm, goalName: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Target Amount (Rs.)">
              <input
                type="number"
                min="1"
                className={inputCls}
                value={editForm.targetAmount}
                onChange={(e) =>
                  setEditForm({ ...editForm, targetAmount: e.target.value })
                }
                required
              />
            </Field>
            <PrioritySelect
              value={editForm.priority}
              onChange={(e) =>
                setEditForm({ ...editForm, priority: e.target.value })
              }
            />
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Deadline cannot be changed
              after creation.
            </p>
            <ModalButtons
              onCancel={closeModal}
              submitting={submitting}
              label="Save Changes"
              color="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            />
          </form>
        </Modal>
      )}

      {modal === "deposit" && selected && (
        <Modal title={`Add Saving — ${selected.goalName}`} onClose={closeModal}>
          <div className="mb-4 bg-[#eaf3e8] rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Progress</span>
              <span className="font-semibold text-gray-700">
                {selected.progressPercentage}
              </span>
            </div>
            <ProgressBar pct={parseFloat(selected.progressPercentage)} />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>
                Rs.{Number(selected.savedAmount).toLocaleString()} saved
              </span>
              <span>
                Rs.{Number(selected.remainingAmount).toLocaleString()} remaining
              </span>
            </div>
          </div>
          <form onSubmit={handleDeposit} className="space-y-4">
            <Field label="Amount (Rs.)">
              <input
                type="number"
                min="1"
                className={inputCls}
                placeholder="e.g. 5000"
                value={depositForm.amount}
                onChange={(e) =>
                  setDepositForm({ ...depositForm, amount: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Account">
              <select
                className={inputCls}
                value={depositForm.account}
                onChange={(e) =>
                  setDepositForm({ ...depositForm, account: e.target.value })
                }
              >
                <option value="Bank">Bank</option>
                <option value="Cash">Cash</option>
              </select>
            </Field>
            <Field label="Note (optional)">
              <input
                className={inputCls}
                placeholder="e.g. Monthly saving"
                value={depositForm.note}
                onChange={(e) =>
                  setDepositForm({ ...depositForm, note: e.target.value })
                }
              />
            </Field>
            <ModalButtons
              onCancel={closeModal}
              submitting={submitting}
              label="Add Saving"
            />
          </form>
        </Modal>
      )}

      {modal === "delete" && selected && (
        <Modal title="Delete Goal" onClose={closeModal}>
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-gray-700 mb-1">
              Are you sure you want to delete{" "}
              <strong>"{selected.goalName}"</strong>?
            </p>
            {selected.savedAmount > 0 && (
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 mt-3">
                Rs.{Number(selected.savedAmount).toLocaleString()} will be
                refunded to your wallet.
              </p>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="mt-6"
          >
            <ModalButtons
              onCancel={closeModal}
              submitting={submitting}
              label="Yes, Delete"
              color="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
