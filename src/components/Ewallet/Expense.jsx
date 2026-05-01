import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import axios from "../../constants/api.js";
import { getToken } from "../../constants/auth.js";

const API_URL = "/ExpenseMoney";

export default function Expense({ show, onClose, onSaved, onOptimisticSave }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    category: "",
    account: "",
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.amount) {
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

      const isoDate = toApiIso(form.date);

      const normalizeCategory = (val) => {
        if (!val) return "";
        const t = String(val).trim().toLowerCase();
        return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
      };

      const payload = {
        date: isoDate,
        Date: isoDate,
        amount:
          parseFloat(form.amount.toString().replace(/[^0-9.-]+/g, "")) || 0,
        category: normalizeCategory(form.category),
        account: form.account,
        note: form.note,
        // backend expects 'description' (zod validation). mirror note into description
        description: form.note ?? "",
        // API expects capitalized type values per docs
        type: "Expense",
      };
      // log payload for debugging
      console.log("Expense: sending payload", payload);

      // attach bearer token if present; keep withCredentials for cookie-based auth
      const token = getToken();
      const config = { withCredentials: true, headers: {} };
      if (token) config.headers.Authorization = `Bearer ${token}`;

      // Optimistically close modal and show toast so it feels instant to the user
      onClose();
      setForm({
        date: new Date().toISOString().slice(0, 10),
        amount: "",
        category: "",
        account: "",
        note: "",
      });
      
      // Let the backend request finish in the background
      if (typeof onOptimisticSave === "function") {
        onOptimisticSave(payload.amount);
      }
      axios
      .post(API_URL, payload, config)
      .then(() => {
        if (typeof onSaved === "function") onSaved();
        toast("You have saved successfully", { type: "success" });
        })
        .catch((err) => {
         
          toast("Insufficient Balance", {
            type: "error",
          });
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      console.error("Expense save error:", err, err?.response?.data);
      let msg = "Failed to save expense";
      if (err?.response) {
        const status = err.response.status;
        let detail = err.response.data;
        try {
          if (typeof detail === "object") detail = JSON.stringify(detail);
        } catch (e) {}
        msg = `Request failed with status ${status}${detail ? ": " + detail : ""}`;
      } else if (err.message) {
        msg = err.message;
      }
      if (msg === "Network Error") {
        msg =
          "Network Error: could not reach http://localhost:5000. Is the backend running and CORS configured?";
      }
      toast(msg, { type: "error" });
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-4">
          <button className={`tab active single-tab`}>Expense</button>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-grid">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />

            <label>Amount</label>
            <input
              type="text"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="Rs. 0"
            />

            <label>Category</label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
            />

            <label>Account</label>
            <input
              type="text"
              name="account"
              value={form.account}
              onChange={handleChange}
            />

            <label>Note</label>
            <input
              type="text"
              name="note"
              value={form.note}
              onChange={handleChange}
            />
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              className="ewallet-btn save-btn"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
