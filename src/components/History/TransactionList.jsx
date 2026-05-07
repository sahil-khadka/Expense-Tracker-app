import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "../../constants/api.js";
import { getToken } from "../../constants/auth.js";
import { MoreVertical, Download, Edit, Trash2 } from "lucide-react";
import EditTransactionModal from "./EditTransactionModal";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
const API_URL = "/viewExpenses";
const DELETE_URL = "/deleteExpense";

function formatDate(d) {
  try {
    if (!d) return "";
    // If the date is a simple YYYY-MM-DD string (set in the form), parse as local date
    const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
    let dt;
    if (typeof d === "string" && isoDateOnly.test(d)) {
      const [y, m, day] = d.split("-").map((n) => parseInt(n, 10));
      dt = new Date(y, m - 1, day);
    } else {
      dt = new Date(d);
    }
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return d;
  }
}

function toCSV(rows) {
  const header = ["Date", "Category", "Account", "Type", "Amount", "Note"];
  const lines = rows.map((r) => [
    r.date,
    r.category || "",
    r.account || "",
    r.type || "",
    r.amount,
    (r.description || r.note || "").replace(/\n/g, " "),
  ]);
  return [header, ...lines]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function normalizeCategory(val) {
  if (!val) return "";
  const t = String(val).trim().toLowerCase();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

export default function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const config = { withCredentials: true, headers: {} };
      if (token) config.headers.Authorization = `Bearer ${token}`;
      const res = await axios.post(API_URL, {}, config);
      console.log("Backend response for History:", res.data); // For debugging

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
        // Fallback: look for any value that is an array
        const arrayVal = Object.values(res.data).find((val) =>
          Array.isArray(val),
        );
        if (arrayVal) data = arrayVal;
      }

      const norm = data.map((t) => ({
        id: t._id, // Assuming the transaction object has an _id field
        date: t.Date || t.date || t.createdAt || "",
        category: normalizeCategory(t.category || t.categoryName || t.raw?.category || ""),
        account: t.account || t.accountName || t.raw?.account || "",
        type: t.type || t.transactionType || "",
        amount: t.amount || t.total || 0,
        description: t.description || t.note || "",
        raw: t,
      }));
      norm.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(norm);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDelete = async (transactionId) => {
    const result = await Swal.fire({
      title: "Delete transaction?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#d1d5db",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      setOpenMenu(null);
      return;
    }

    try {
      const token = getToken();
      await axios.delete(`${DELETE_URL}/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      await fetchTransactions();
      setOpenMenu(null);
      toast.success("Transaction deleted successfully!",{
        autoClose: 1000,
        position: "top-right",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        progressClassName: "bg-blue-500",
        progressBarClassName: "bg-blue-500",
        iconClassName: "bg-blue-500",
        textClassName: "bg-blue-500",
        bodyClassName: "bg-blue-500",
        headerClassName: "bg-blue-500",
        footerClassName: "bg-blue-500",
      });
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      setOpenMenu(null);
      toast.error("Failed to delete transaction.");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete transaction.",
      });
    }
  };

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
    setOpenMenu(null);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (typeFilter !== "all" && String(t.type).toLowerCase() !== typeFilter)
        return false;
      if (!q) return true;
      return (
        (t.category || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.type || "").toLowerCase().includes(q) ||
        formatDate(t.date).toLowerCase().includes(q)
      );
    });
  }, [transactions, query, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

const downloadCsv = async () => {
  const result = await Swal.fire({
    title: "Download CSV?",
    text: "Do you want to download the transaction data as CSV?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#16a34a",
    cancelButtonColor: "#d1d5db",
    confirmButtonText: "Download",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();

    URL.revokeObjectURL(url);
    toast.success("CSV file downloaded successfully.");
  } catch (err) {
    console.error("CSV download failed:", err);
    toast.error("Failed to download CSV file.");
  }
};

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      if (page <= Math.ceil(maxPagesToShow / 2)) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (page + Math.floor(maxPagesToShow / 2) >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = page - Math.floor(maxPagesToShow / 2);
        endPage = page + Math.floor(maxPagesToShow / 2);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`px-4 py-2 mx-1 rounded ${
            page === i
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 border"
          }`}
        >
          {i}
        </button>,
      );
    }
    return pageNumbers;
  };

  return (
    <>
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        transaction={selectedTransaction}
        onTransactionUpdated={() => {
          fetchTransactions();
          setEditModalOpen(false);
        }}
      />
      <div className="mt-8  bg-green-100 rounded-xl p-6 shadow-md border-4 border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 w-1/2">
            <input
              placeholder="Search transaction"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="w-full border rounded px-4 py-3 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Filter</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="border rounded px-3 py-2"
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={downloadCsv}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100"
              >
                <Download className="w-4 h-4 " />
                <span>Download CSV</span>
              </button>
<button
  onClick={async () => {
    const result = await Swal.fire({
      title: "Download Report?",
      text: "Do you want to download the PDF report?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#d1d5db",
      confirmButtonText: "Download",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const token = getToken();
      const config = {
        withCredentials: true,
        responseType: "blob",
        headers: {},
      };

      if (token) config.headers.Authorization = `Bearer ${token}`;

      const res = await axios.get("/download", config);

      const blob = new Blob([res.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Expense-Report-${Date.now()}.pdf`;
      a.click();

      window.URL.revokeObjectURL(url);

      toast.success("PDF report downloaded successfully.");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download PDF report.");
    }
  }}
  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100"
>
  <Download className="w-4 h-4" />
  <span>Download PDF</span>
</button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-gray-600 border-b">
                <th className="py-4">Date</th>
                <th className="py-4">Category</th>
                <th className="py-4">Account</th>
                <th className="py-4">Type</th>
                <th className="py-4">Amount</th>
                <th className="py-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    Loading...
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    No transactions found
                  </td>
                </tr>
              ) : (
                pageData.map((t, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-6 align-top w-1/4">
                      {formatDate(t.date)}
                    </td>
                    <td className="py-6 align-top w-1/4">
                      <div className="font-medium text-gray-800">{t.category}</div>
                      <div className="text-xs text-gray-500 mt-1">{t.description}</div>
                    </td>
                    <td className="py-6 align-top w-1/6">
                      <div className="text-sm text-gray-700">{t.account || "-"}</div>
                    </td>
                    <td className="py-6 align-top w-1/4">{t.type}</td>
                    <td className="py-6 align-top w-1/6">
                      Rs. {Number(t.amount).toLocaleString()}
                    </td>
                    <td className="py-6 align-top text-right relative">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === idx ? null : idx)
                        }
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {openMenu === idx && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border"
                        >
                          <ul className="py-1">
                            <li>
                              <button
                                onClick={() => handleEdit(t)}
                                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => handleDelete(t.id)}
                                className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-center items-center">
          <div className="flex items-center bg-gray-100 rounded-full p-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-3 py-1 mx-1 rounded disabled:opacity-50"
            >
              &lt;&lt;
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 mx-1 rounded disabled:opacity-50"
            >
              &lt;
            </button>
            {renderPageNumbers()}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 mx-1 rounded disabled:opacity-50"
            >
              &gt;
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-3 py-1 mx-1 rounded disabled:opacity-50"
            >
              &gt;&gt;
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
