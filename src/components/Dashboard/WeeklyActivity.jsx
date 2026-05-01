import React, { useMemo } from "react";

export default function WeeklyActivity({ transactions = [], barData = null }) {
  // desired labels/order: Sat -> Sun -> Mon -> Tue -> Wed -> Thu -> Fri
  const labels = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

  const { data, maxValue, ySteps } = useMemo(() => {
    // If backend provided weekly barchart data, use it directly.
    if (barData && Array.isArray(barData) && barData.length > 0) {
      const arr = labels.map((label) => {
        const row = barData.find((d) => d.day === label) || {};
        return {
          label,
          income: Number(row.Deposit) || 0,
          expense: Number(row.Withdraw) || 0,
        };
      });
      const max = Math.max(...arr.flatMap((d) => [d.income, d.expense]), 100);
      const top = Math.ceil(max / 100) * 100;
      const steps = 5;
      const yLabels = Array.from({ length: steps + 1 }, (_, i) =>
        Math.round((top * (steps - i)) / steps),
      );
      return { data: arr, maxValue: top, ySteps: yLabels };
    }

    const map = labels.reduce((acc, l) => {
      acc[l] = { income: 0, expense: 0 };
      return acc;
    }, {});

    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    (transactions || []).forEach((t) => {
      const dateStr = t.date || t.Date || t.raw?.date || t.raw?.createdAt || "";
      const date = dateStr ? new Date(dateStr) : null;
      const kind = (t.type || t.transactionType || "").toString().toLowerCase();
      const amt = Number(t.amount) || Number(t.total) || 0;
      if (!date || Number.isNaN(amt)) return;
      const day = weekdayNames[date.getDay()];
      if (map[day] === undefined) return;
      if (kind === "expense") map[day].expense += amt;
      else map[day].income += amt;
    });

    const arr = labels.map((label) => ({
      label,
      income: map[label].income,
      expense: map[label].expense,
    }));

    const max = Math.max(...arr.flatMap((d) => [d.income, d.expense]), 100);
    const top = Math.ceil(max / 100) * 100;
    const steps = 5;
    const yLabels = Array.from({ length: steps + 1 }, (_, i) =>
      Math.round((top * (steps - i)) / steps),
    );

    return { data: arr, maxValue: top, ySteps: yLabels };
  }, [transactions, barData]);

  return (
    <div className="flex-[0.7] min-w-[420px]">
      <h2 className="text-xl font-medium mb-6 text-[#0d4f2a]">
        Weekly Activity
      </h2>
      <div
        className="rounded-[20px] p-6 h-[380px] flex flex-col relative"
        style={{
          background: "rgba(255,255,255,0.85)",
          boxShadow: "0 10px 30px rgba(30,80,40,0.06)",
        }}
      >
        {/* Legend */}
        <div className="flex justify-end gap-6 text-xs mb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#0ce704]"></div>
            <span>Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#c24b2f]"></div>
            <span>Expense</span>
          </div>
        </div>

        {/* Bar Chart Area */}
        <div className="flex-1 flex mt-2 relative">
          {/* Y-axis Labels & Grid */}
          <div className="flex flex-col justify-between text-xs text-gray-500 pr-4 pb-6 w-12 z-10 bg-[#e4e4e4]">
            {ySteps.map((y, i) => (
              <span key={i}>{y}</span>
            ))}
          </div>

          <div className="flex-1 flex justify-between items-end pb-6 relative h-full">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pb-6 opacity-30 pointer-events-none">
              {ySteps.map((_, i) => (
                <div
                  key={i}
                  className="border-b border-gray-500 w-full h-[1px]"
                ></div>
              ))}
            </div>

            {/* Bars */}
            {data.map((day, idx) => (
              <div
                key={idx}
                className="flex gap-1 h-full items-end z-10 w-8 justify-center group relative"
              >
                <div
                  className="w-3 bg-[#0ce704] rounded-t-sm"
                  style={{ height: `${(day.income / (maxValue || 1)) * 100}%` }}
                  title={`Income: ${day.income}`}
                ></div>
                <div
                  className="w-3 bg-[#c24b2f] rounded-t-sm"
                  style={{
                    height: `${(day.expense / (maxValue || 1)) * 100}%`,
                  }}
                  title={`Expense: ${day.expense}`}
                ></div>
                <span className="absolute -bottom-6 text-xs text-gray-600">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
