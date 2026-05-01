import React, { useMemo } from "react";
import { ChevronDown } from "lucide-react";

export default function ExpenseStatistics({
  expenseStats,
  totalExpense,
  pieBackground,
  slices,
  transactions,
}) {
  // If `transactions` provided, compute category totals from transaction data (expenses only)
  const computed = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;
    const agg = {};
    transactions.forEach((t) => {
      const kind = (t.type || t.transactionType || "").toString().toLowerCase();
      if (kind !== "expense") return;
      const cat = t.category || t.categoryName || t.raw?.category || "Other";
      const amt = Number(t.amount) || Number(t.total) || 0;
      if (!agg[cat]) agg[cat] = 0;
      agg[cat] += amt;
    });
    const arr = Object.entries(agg).map(([category, amount]) => ({
      category,
      amount,
    }));
    const total = arr.reduce((s, it) => s + it.amount, 0);
    return { expenseStats: arr, totalExpense: total };
  }, [transactions]);

  const hasData =
    (computed &&
      computed.expenseStats.length > 0 &&
      computed.totalExpense > 0) ||
    (expenseStats && expenseStats.length > 0 && totalExpense > 0);

  return (
    <div className="flex-[0.9]">
      <h2 className="text-xl font-medium mb-4 text-[#0d4f2a]">
        Expense Statistics
      </h2>
      <div
        className="rounded-[20px] p-6 h-[440px] w-[720px] flex flex-row items-center justify-between relative"
        style={{
          background: "rgba(255,255,255,0.95)",
          boxShadow: "0 25px 60px rgba(6, 40, 15, 0.14)",
        }}
      >
        <div className="absolute top-4 left-4 flex items-center gap-1 cursor-pointer">
          <span className="text-sm font-medium">Spending Monthly Overview</span>
        </div>

        {/* Left: Donut chart with center total */}
        <div className="flex items-center gap-6 pl-8">
          <div className="relative w-56 h-56">
            {/* build background from slices or fallback */}
            <div
              className="w-56 h-56 rounded-full"
              style={{
                background:
                  (hasData &&
                    (() => {
                      const useStats = computed
                        ? computed.expenseStats
                        : expenseStats || [];
                      const total = computed
                        ? computed.totalExpense
                        : totalExpense ||
                          useStats.reduce((s, it) => s + (it.amount || 0), 0) ||
                          1;
                      const pieColors = [
                        "#16a34a",
                        "#eab308",
                        "#3b82f6",
                        "#ef4444",
                        "#a855f7",
                        "#ec4899",
                        "#f97316",
                      ];
                      let cur = 0;
                      const stops = (useStats || [])
                        .map((stat, idx) => {
                          const pct = ((stat.amount || 0) / (total || 1)) * 100;
                          const start = cur;
                          const end = cur + pct;
                          cur = end;
                          return `${pieColors[idx % pieColors.length]} ${start}% ${end}%`;
                        })
                        .join(", ");
                      return useStats.length > 0
                        ? `conic-gradient(${stops})`
                        : "conic-gradient(#e5e7eb 0% 100%)";
                    })()) ||
                  "conic-gradient(#e5e7eb 0% 100%)",
                transform: "rotate(-45deg)",
              }}
            ></div>

            {/* center hole */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center shadow-sm">
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-sm font-semibold">
                Rs.
                {Math.round(
                  computed?.totalExpense ||
                    totalExpense ||
                    (expenseStats || []).reduce(
                      (s, it) => s + (it.amount || 0),
                      0,
                    ) ||
                    0,
                ).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Right: category list with percentages and amounts */}
        <div className="pr-8 flex-1 flex flex-col gap-4">
          <div className="flex-1 flex flex-col justify-center">
            {((computed && computed.expenseStats) || expenseStats || [])
              .slice(0, 6)
              .map((it, idx) => {
                const total = computed
                  ? computed.totalExpense
                  : totalExpense ||
                    (expenseStats || []).reduce(
                      (s, ii) => s + (ii.amount || 0),
                      0,
                    ) ||
                    1;
                const pct = total ? ((it.amount || 0) / total) * 100 : 0;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b border-white/50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-3 h-3 rounded-full ml-20"
                        style={{
                          background: [
                            "#16a34a",
                            "#eab308",
                            "#3b82f6",
                            "#ef4444",
                            "#a855f7",
                            "#ec4899",
                          ][idx % 6],
                        }}
                      ></div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {it.category}
                        </div>
                                <div className="text-xs text-gray-500">
                                  {pct >= 1
                                    ? `${Math.round(pct)}%`
                                    : pct > 0
                                    ? "<1%"
                                    : "0%"}
                                </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold mr-10">
                      Rs.{Number(it.amount).toLocaleString()}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
