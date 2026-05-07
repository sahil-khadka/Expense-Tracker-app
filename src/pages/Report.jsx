import React, { useMemo, useState } from "react";
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

  const topRow = useMemo(() => {
    if (range === "weekly") {
      return (
        <>
          <WeeklyActivitySection loading={weekly.loading} days={weekly.days} />
          <QuickStatsSection
            totalIncome={weekly.totalIncome}
            totalExpense={weekly.totalExpense}
            netBalance={weekly.netBalance}
          />
        </>
      );
    }

    return (
      <>
        <MonthlyActivitySection
          loading={loading}
          segments={computed.segments}
        />
        <QuickStatsSection
          totalIncome={totalIncome}
          totalExpense={computed.totalExp}
          netBalance={netBalance}
        />
      </>
    );
  }, [
    range,
    weekly,
    loading,
    computed.segments,
    totalIncome,
    netBalance,
    computed.totalExp,
  ]);

  const bottomRow = useMemo(() => {
    if (range === "weekly") {
      return (
        <>
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
        </>
      );
    }

    return (
      <>
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
      </>
    );
  }, [
    range,
    weekly,
    loading,
    hasData,
    computed.monthlySummary,
    computed.top,
    computed.bottom,
    computed.suggestion,
    computed.opportunity,
  ]);

  return (
    <div className="min-h-screen bg-[#dce7d7] text-gray-800 font-sans flex flex-col overflow-hidden">
      <UserNavbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main
          className="flex-1 bg-transparent relative overflow-y-auto pb-14 pt-16"
          style={{ marginLeft: "var(--sidebar-width, 256px)" }}
        >
          <div className="p-10 max-w-[1180px]">
            <h1 className="text-4xl font-bold text-[#1a2b20]">Report</h1>

            <div className="mt-3">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-[220px] rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm font-semibold text-[#1a2b20] focus:outline-none focus:ring-2 focus:ring-[#2f5c2b]/30"
                aria-label="Report range"
              >
                <option value="monthly">Monthly Data</option>
                <option value="weekly">Weekly Data</option>
              </select>
            </div>

            {range === "monthly" && (
              <div className="mt-3">
                <input
                  type="month"
                  value={monthKey}
                  onChange={(e) => setMonthKey(e.target.value)}
                  className="w-[220px] rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm font-semibold text-[#1a2b20] focus:outline-none focus:ring-2 focus:ring-[#2f5c2b]/30"
                  aria-label="Report month"
                />
              </div>
            )}

            {/* Top row */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {topRow}
            </div>

            {/* Bottom row */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {bottomRow}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
