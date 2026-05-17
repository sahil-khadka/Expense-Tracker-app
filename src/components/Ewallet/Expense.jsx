import React, { useEffect, useState } from "react";
import { X, TrendingDown } from "lucide-react";
import { toast } from "react-toastify";
import axios from "../../constants/api.js";
import { getToken } from "../../constants/auth.js";
import VoiceRecorder from "../VoiceInput/VoiceRecorder";
import { validateTransactionForm } from "./transactionValidation.js";

const API_URL = "/ExpenseMoney";

export default function Expense({ show, onClose, onSaved, availableBalance }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    category: "",
    account: "Cash",
    note: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      setForm((s) => ({
        ...s,
        date: new Date().toISOString().slice(0, 10),
      }));
      setErrors({});
    }
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSave = async (e, voiceFormData = null) => {
    e.preventDefault();
    const currentForm = voiceFormData || form;
    const validation = validateTransactionForm(currentForm, "Expense", {
      availableBalance,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.warning(Object.values(validation.errors)[0]);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const { values } = validation;

      const payload = {
        date: values.isoDate,
        Date: values.isoDate,
        amount: values.amount,
        category: values.category,
        account: values.account,
        note: values.note,
        description: values.note,
        type: "Expense",
      };

      const token = getToken();
      const config = {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      };

      // Do not apply optimistic balance updates for expenses (avoid negative UI state)
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
        } catch {
          detail = "Unable to read error details";
        }

        msg = `Request failed with status ${status}${
          detail ? ": " + detail : ""
        }`;
      } else if (err?.message) {
        msg = err.message;
      }

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  const fieldClass = (field) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
      errors[field]
        ? "border-red-400 bg-red-50 focus:ring-red-200"
        : "border-gray-300 focus:ring-rose-500"
    }`;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-emerald-700">
              Record Expense
            </h2>
          </div>

          <VoiceRecorder
            onCommandParsed={(data) => {
              const parsed = data?.voiceCommand?.parsedData || data?.parsedData;

              if (parsed) {
                if (parsed.action && parsed.action !== "add_expense") {
                  toast.warning(
                    "This voice command is for income. Open Income to record it.",
                  );
                  return;
                }

                const updatedForm = {
                  ...form,
                  amount: parsed.amount?.toString() || form.amount,
                  category: parsed.category?.trim() || form.category || "General",
                  note: parsed.description || form.note,
                  account:
                    parsed.account === "Bank" || parsed.account === "Cash"
                      ? parsed.account
                      : form.account,
                };

                setForm(updatedForm);
                handleSave({ preventDefault: () => {} }, updatedForm);
              }
            }}
            disabled={loading}
          />
        </div>

        <form onSubmit={handleSave}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  max={new Date().toISOString().slice(0, 10)}
                  aria-invalid={Boolean(errors.date)}
                  className={fieldClass("date")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="text"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Rs. 0"
                  inputMode="decimal"
                  aria-invalid={Boolean(errors.amount)}
                  className={fieldClass("amount")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g., Food, Travel"
                  maxLength={40}
                  aria-invalid={Boolean(errors.category)}
                  className={fieldClass("category")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account
                </label>
                <select
                  name="account"
                  value={form.account}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.account)}
                  className={`${fieldClass("account")} bg-white`}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Note
              </label>
              <input
                type="text"
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Add a note (optional)"
                maxLength={160}
                aria-invalid={Boolean(errors.note)}
                className={fieldClass("note")}
              />
              <div className="mt-1 flex justify-between gap-3 text-xs">
                <span className="ml-auto text-gray-400">
                  {form.note.length}/160
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-lg"
          >
            {loading ? "Saving..." : "Record Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
