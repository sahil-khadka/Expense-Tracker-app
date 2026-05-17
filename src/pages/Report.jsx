import React, { useState } from "react";
import Sidebar from "../components/Dashboard/Sidebar";
import UserNavbar from "../components/Dashboard/UserNavbar";
import MonthlyActivitySection from "../components/Report/MonthlyActivitySection.jsx";
import QuickStatsSection from "../components/Report/QuickStatsSection.jsx";
import MonthlySummaryCard from "../components/Report/MonthlySummaryCard.jsx";
import InsightsCard from "../components/Report/InsightsCard.jsx";
import { useReportData } from "../components/Report/useReportData.js";
import WeeklyActivitySection from "../components/Report/WeeklyActivitySection.jsx";
import WeeklySummaryCard from "../components/Report/WeeklySummaryCard.jsx";
import WeeklyInsightsCard from "../components/Report/WeeklyInsightsCard.jsx";
import { useWeeklyReportData } from "../components/Report/useWeeklyReportData.js";


export default function Report() {
  const [range, setRange] = useState("weekly");
  const [monthKey, setMonthKey] = useState(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${mm}`;
  });

  const { loading, totalIncome, netBalance, computed, hasData } = useReportData(
    {
      monthKey,
      enabled: range === "monthly",
    },
  );
  


  const weekly = useWeeklyReportData({ enabled: range === "weekly" });

  return (
    <div className="min-h-screen bg-[#f4f7f4] font-sans flex flex-col overflow-hidden">
      <UserNavbar />

      <div className="flex flex-1 overflow-hidden ">
        <Sidebar />

        <main
          className="flex-1 overflow-y-auto pb-20 pt-16"
          style={{ marginLeft: "var(--sidebar-width, 256px)" }}
        >
          <div className="p-8 lg:p-10 max-w-[1200px]">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#1a3328]">Report</h1>
              <p className="text-sm text-gray-500 mt-1">
                Detailed insights into your financial activities
              </p>
            </div>

            {/* Toggle bar */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                {["weekly", "monthly"].map((r) => (
                  <button

                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                      range === r
                        ? "bg-[#2d6a3f] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>


              {range === "monthly" && (
                <input
                  type="month"
                  value={monthKey}
                  onChange={(e) => setMonthKey(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white shadow-sm px-4 py-2 text-sm font-medium text-[#1a3328] focus:outline-none focus:ring-2 focus:ring-[#2d6a3f]/25 transition-all"
                  aria-label="Report month"
                />
              )}
            </div>

            {/* Content grid */}
            {range === "weekly" ? (
              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.95fr] gap-6">
                <WeeklyActivitySection
                  loading={weekly.loading}
                  segments={weekly.segments}
                />
                <div className="flex flex-col gap-5">
                  <QuickStatsSection
                    totalIncome={weekly.totalIncome}
                    totalExpense={weekly.totalExpense}
                    netBalance={weekly.netBalance}
                  />

                  <WeeklySummaryCard
                    loading={weekly.loading}
                    hasData={weekly.hasData}
                    text={weekly.weeklySummary}
                  />
                  <WeeklyInsightsCard
                    loading={weekly.loading}
                    hasData={weekly.hasData}
                    highestCategory={weekly.highestExpenseCategory}
                    highestAmount={weekly.highestExpenseCategoryAmount}
                    lowestCategory={weekly.lowestExpenseCategory}
                    lowestAmount={weekly.lowestExpenseCategoryAmount}

                    suggestion={weekly.suggestion}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.95fr] gap-6">
                <MonthlyActivitySection
                  loading={loading}
                  segments={computed.segments}
                />
                <div className="flex flex-col gap-5">
                  <QuickStatsSection
                    totalIncome={totalIncome}
                    totalExpense={computed.totalExp}
                    netBalance={netBalance}
                  />
                  <MonthlySummaryCard
                    loading={loading}
                    hasData={hasData}
                    text={computed.monthlySummary}
                  />
                  <InsightsCard
                    hasData={hasData}
                    highestCategory={computed.top?.category}
                    lowestCategory={computed.bottom?.category}
                    suggestion={computed.suggestion}
                    opportunity={computed.opportunity}
                  />
                </div>

              </div>
            )}

          </div>

        </main>
      </div>
    </div>
  );
}
