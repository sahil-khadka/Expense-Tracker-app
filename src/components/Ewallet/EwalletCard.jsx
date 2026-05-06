import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function EwalletCard({ name = "User", balance = "0.00" }) {
  const [visible, setVisible] = useState(false); // default hidden

  return (
    <div className="p-6 mb-8 shadow-card rounded-[20px] border border-emerald-200 bg-emerald-100">
      {" "}
      <div className="flex justify-between items-start">
        <div>
          <div className="text-lg text-[#234b2e] font-medium">
            Welcome {name}!
          </div>
          <div className="mt-4 text-sm text-[#234b2e]">Balance</div>
          <div className="mt-2 text-2xl font-semibold text-[#083b22] flex items-center gap-3">
            Rs. {visible ? balance : "xxxxxx"}
            <button
              aria-label="Toggle balance visibility"
              onClick={() => setVisible((v) => !v)}
              className="p-1 rounded"
            >
              {visible ? (
                <Eye className="w-5 h-5 text-[#083b22] opacity-85" />
              ) : (
                <EyeOff className="w-5 h-5 text-[#083b22] opacity-85" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
