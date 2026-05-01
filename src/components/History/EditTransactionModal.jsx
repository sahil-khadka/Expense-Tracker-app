import React, { useState, useEffect } from "react";
import axios from "../../constants/api.js";
import { getToken } from "../../constants/auth.js";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
const UPDATE_URL = "/updateexpense";

export default function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  onTransactionUpdated,
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Expense");

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount || "");
      setCategory(transaction.category || "");
      setDescription(transaction.description || "");
      setType(transaction.type || "Expense");
      // Format date for input[type="date"]
      setDate(
        transaction.date
          ? new Date(transaction.date).toISOString().split("T")[0]
          : "",
      );
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

const handleSave = async (e) => {
  e.preventDefault();

  const result = await Swal.fire({
    title: "Save Changes?",
    text: "Do you want to update this transaction?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#d1d5db",
    confirmButtonText: "Yes, Update",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    const token = getToken();
    const config = {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    };

    const payload = {
      type,
      amount: Number(amount),
      category,
      account: "Cash",
      description,
      date,
    };

    await axios.put(`${UPDATE_URL}/${transaction.id}`, payload, config);

    toast.success("Transaction updated successfully!",{
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


    onTransactionUpdated();
    onClose();
  } catch (error) {
    console.error("Failed to update transaction:", error);
    toast.error("Failed to update transaction.");
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Edit Transaction</h2>
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="amount">
              Amount
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="category">
              Category
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="date">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              rows="3"
            ></textarea>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="Income"
                  checked={type === "Income"}
                  onChange={(e) => setType(e.target.value)}
                  className="mr-2"
                />
                Income
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="Expense"
                  checked={type === "Expense"}
                  onChange={(e) => setType(e.target.value)}
                  className="mr-2"
                />
                Expense
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
