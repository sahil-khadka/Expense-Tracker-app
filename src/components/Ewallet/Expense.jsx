import React, { useEffect, useState } from "react";
import { X, TrendingDown } from "lucide-react";
import { toast } from "react-toastify";
import axios from "../../constants/api.js";
import { getToken } from "../../constants/auth.js";
import VoiceRecorder from "../VoiceInput/VoiceRecorder";

const API_URL = "/ExpenseMoney";

export default function Expense({ show, onClose, onSaved, onOptimisticSave }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    category: "",
    account: "Cash",
    note: "",
  });

  useEffect(() => {
    if (show) {
      setForm((s) => ({ ...s, date: new Date().toISOString().slice(0, 10) }));
    }
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const [loading, setLoading] = useState(false);

  const handleSave = async (e, voiceFormData = null) => {
    e.preventDefault();
    const currentForm = voiceFormData || form;

    if (!currentForm.amount) {
      toast("Please enter an amount", { type: "error" });
      return;
    }
    setLoading(true);
    try {
      function toApiIso(dateStr) {
        const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
        if (typeof dateStr === "string" && isoDateOnly.test(dateStr)) {
          const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
          // use midday local time to avoid timezone date shifts
          return new Date(y, m - 1, d, 12, 0, 0).toISOString();
        }
        try {
          return new Date(dateStr).toISOString();
        } catch (e) {
          return dateStr;
        }
      }

      const isoDate = toApiIso(currentForm.date);

      const normalizeCategory = (val) => {
        if (!val) return "";
        const t = String(val).trim().toLowerCase();
        return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
      };

      const payload = {
        date: isoDate,
        Date: isoDate,
        amount:
          parseFloat(currentForm.amount.toString().replace(/[^0-9.-]+/g, "")) || 0,
        category: normalizeCategory(currentForm.category),
        account: currentForm.account,
        note: currentForm.note,
        // backend expects 'description' (zod validation). mirror note into description
        description: currentForm.note ?? "",
        // API expects capitalized type values per docs
        type: "Expense",
      };
      // log payload for debugging
      console.log("Expense: sending payload", payload);

      // attach bearer token if present; keep withCredentials for cookie-based auth
      const token = getToken();
      const config = { withCredentials: true, headers: {} };
      if (token) config.headers.Authorization = `Bearer ${token}`;

      // Keep optimistic balance update, but show final toast only after server confirms.
      if (typeof onOptimisticSave === "function") {
        onOptimisticSave(payload.amount);
      }
      await axios.post(API_URL, payload, config);

      if (typeof onSaved === "function") onSaved();
      toast.success("Expense saved successfully.");
      onClose();
      setForm({
        date: new Date().toISOString().slice(0, 10),
        amount: "",
        category: "",
        account: "Cash",
        note: "",
      });
    } catch (err) {
      console.error("Expense save error:", err, err?.response?.data);
      let msg = "Failed to save expense";
      const isInsufficientBalance =
        err?.response?.status === 400 &&
        String(err?.response?.data?.message || "")
          .toLowerCase()
          .includes("insufficient");

      if (isInsufficientBalance) {
        msg = "Insufficient balance in your wallet.";
      } else if (err?.response) {
        const status = err.response.status;
        let detail = err.response.data;
        try {
          if (typeof detail === "object") detail = JSON.stringify(detail);
        } catch (e) {}
        msg = `Request failed with status ${status}${detail ? ": " + detail : ""}`;
      } else if (err?.message) {
        msg = err.message;
      }
      if (msg === "Network Error") {
        msg =
          "Network Error: could not reach http://localhost:5000. Is the backend running and CORS configured?";
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-orange-700">Record Expense</h2>
          </div>
          <VoiceRecorder
            onCommandParsed={(data) => {
              // Auto-fill the form with parsed data
              const parsed = data.voiceCommand?.parsedData || data.parsedData;
              if (parsed) {
                const updatedForm = {
                  ...form,
                  amount: parsed.amount?.toString() || form.amount,
                  category: parsed.category || form.category,
                  note: parsed.description || form.note,
                  account: parsed.account || form.account
                };

                setForm(updatedForm);
                // Auto-submit immediately with the parsed data
                handleSave({ preventDefault: () => {} }, updatedForm);
                toast.success('Form auto-filled from voice command! Submitting...');
              }
            }}
            disabled={loading}
          />
        </div>

        <form onSubmit={handleSave}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                <input
                  type="text"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Rs. 0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g., Food, Travel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account</label>
                <select 
                  name="account" 
                  value={form.account} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition appearance-none cursor-pointer bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Note</label>
              <input
                type="text"
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Add a note (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-orange-400 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-500 hover:to-amber-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            disabled={loading}
          >
            {loading ? "Saving..." : "Record Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
