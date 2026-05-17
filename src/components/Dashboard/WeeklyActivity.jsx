import React, { useMemo } from "react";

const LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MIN_VISIBLE_BAR_PERCENT = 3;
const SKEW_RATIO_THRESHOLD = 10;

function formatMoney(value) {
  const amount = Number(value) || 0;

  if (amount >= 100000) {
    return amount.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });
  }

  return amount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

function roundChartTop(value) {
  if (value <= 100) return 100;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

function getPositiveValues(data) {
  return data
    .flatMap((item) => [item.income, item.expense])
    .filter((value) => value > 0);
}

export default function WeeklyActivity({ transactions = [], barData = null }) {
  const { data, maxValue, ySteps, scaleMode } = useMemo(() => {
    // If backend provided weekly barchart data, use it directly.
    if (barData && Array.isArray(barData) && barData.length > 0) {
      const arr = LABELS.map((label) => {
        const row = barData.find((d) => d.day === label) || {};
        return {
          label,
          income: Number(row.Deposit) || 0,
          expense: Number(row.Withdraw) || 0,
        };
      });
      const values = getPositiveValues(arr);
      const max = Math.max(...values, 100);
      const min = Math.min(...values, max);
      const top = roundChartTop(max);
      const compressed = values.length > 1 && max / min >= SKEW_RATIO_THRESHOLD;
      const steps = 5;
      const yLabels = Array.from({ length: steps + 1 }, (_, i) => {
        const ratio = (steps - i) / steps;
        if (compressed) {
          return Math.round(Math.expm1(Math.log1p(top) * ratio));
        }
        return Math.round(top * ratio);
      });
      return {
        data: arr,
        maxValue: top,
        ySteps: yLabels,
        scaleMode: compressed ? "compressed" : "linear",
      };
    }

    const map = LABELS.reduce((acc, l) => {
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

    const arr = LABELS.map((label) => ({
      label,
      income: map[label].income,
      expense: map[label].expense,
    }));

    const values = getPositiveValues(arr);
    const max = Math.max(...values, 100);
    const min = Math.min(...values, max);
    const top = roundChartTop(max);
    const compressed = values.length > 1 && max / min >= SKEW_RATIO_THRESHOLD;
    const steps = 5;
    const yLabels = Array.from({ length: steps + 1 }, (_, i) => {
      const ratio = (steps - i) / steps;
      if (compressed) {
        return Math.round(Math.expm1(Math.log1p(top) * ratio));
      }
      return Math.round(top * ratio);
    });

    return {
      data: arr,
      maxValue: top,
      ySteps: yLabels,
      scaleMode: compressed ? "compressed" : "linear",
    };
  }, [transactions, barData]);

  const getBarHeight = (value) => {
    const amount = Number(value) || 0;
    if (amount <= 0) return "0%";

    const ratio =
      scaleMode === "compressed"
        ? Math.log1p(amount) / Math.log1p(maxValue || 1)
        : amount / (maxValue || 1);

    return `${Math.max(MIN_VISIBLE_BAR_PERCENT, Math.min(100, ratio * 100))}%`;
  };

  return (
    <div className="p-1 h-[380px] flex flex-col relative">
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
          <div className="flex flex-col justify-between text-[10px] text-gray-500 pr-2 pb-6 w-16 z-10 bg-[#e4e4e4]">
            {ySteps.map((y, i) => (
              <span key={i}>Rs. {formatMoney(y)}</span>
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
                  style={{ height: getBarHeight(day.income) }}
                  title={`Income: Rs. ${formatMoney(day.income)}`}
                ></div>
                <div
                  className="w-3 bg-[#c24b2f] rounded-t-sm"
                  style={{ height: getBarHeight(day.expense) }}
                  title={`Expense: Rs. ${formatMoney(day.expense)}`}
                ></div>
                <span className="absolute -bottom-6 text-xs text-gray-600">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
