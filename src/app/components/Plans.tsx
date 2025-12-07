"use client";

import { useState, useEffect } from "react";
import AddPlan from "./AddPlan";
import { useLanguage } from "../i18n/LanguageContext";

type PlanStatus = "ongoing" | "done" | "expired" | "trash";

interface Plan {
  name: string;
  shares: string;
  stockName: string;
  stockId: string;
  targetPrice: string;
  deadline: string;
  currentPrice?: string;
  action: "buy" | "sell";
  status: PlanStatus;
}

const STORAGE_KEY = "stock-plans";

export default function Plans() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load plans from localStorage on mount
  useEffect(() => {
    const savedPlans = localStorage.getItem(STORAGE_KEY);
    if (savedPlans) {
      try {
        setPlans(JSON.parse(savedPlans));
      } catch (error) {
        console.error("11111 Error loading plans from localStorage:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save plans to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    }
  }, [plans, isLoaded]);

  // Export plans to CSV
  const exportToCSV = () => {
    if (plans.length === 0) return;

    // CSV headers
    const headers = ["Plan Name", "Stock Symbol", "Stock Name", "Action", "Shares", "Target Price", "Current Price", "Change %", "Deadline", "Status"];

    // Convert plans to CSV rows
    const rows = plans.map(plan => {
      const currentP = plan.currentPrice ? parseFloat(plan.currentPrice) : 0;
      const targetP = plan.targetPrice ? parseFloat(plan.targetPrice) : 0;
      const percentChange = currentP > 0 && targetP > 0
        ? (((targetP - currentP) / currentP) * 100).toFixed(2) + "%"
        : "";

      return [
        `"${plan.name.replace(/"/g, '""')}"`,
        plan.stockId,
        `"${(plan.stockName || "").replace(/"/g, '""')}"`,
        plan.action.toUpperCase(),
        plan.shares,
        plan.targetPrice ? `$${plan.targetPrice}` : "",
        plan.currentPrice ? `$${plan.currentPrice}` : "",
        percentChange,
        plan.deadline || "",
        plan.status || "ongoing",
      ].join(",");
    });

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stock-plans-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        {plans.length > 0 && (
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t("exportCSV")}
          </button>
        )}
        <button
          onClick={() => setIsDialogOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("addPlan")}
        </button>
      </div>

      {/* Add Plan Dialog */}
      <AddPlan
        setPlans={setPlans}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      {/* Plans Table */}
      <div className="mt-8 overflow-x-auto">
        {plans.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">{t("noPlansYet")}</h3>
            <p className="text-zinc-500 dark:text-zinc-400">{t("clickAddPlan")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="text-left py-3 px-4 font-medium text-zinc-500 dark:text-zinc-400">{t("plan")}</th>
                <th className="text-left py-3 px-4 font-medium text-zinc-500 dark:text-zinc-400">{t("stock")}</th>
                <th className="text-left py-3 px-4 font-medium text-zinc-500 dark:text-zinc-400">{t("action")}</th>
                <th className="text-right py-3 px-4 font-medium text-zinc-500 dark:text-zinc-400">{t("shares")}</th>
                <th className="text-right py-3 px-4 font-medium text-zinc-500 dark:text-zinc-400">{t("targetPrice")}</th>
                <th className="text-right py-3 px-4 font-medium text-zinc-500 dark:text-zinc-400">{t("change")}</th>
                <th className="text-left py-3 px-4 font-medium text-zinc-500 dark:text-zinc-400">{t("deadline")}</th>
                <th className="text-left py-3 px-4 font-medium text-zinc-500 dark:text-zinc-400">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, index) => {
                const currentP = plan.currentPrice ? parseFloat(plan.currentPrice) : 0;
                const targetP = plan.targetPrice ? parseFloat(plan.targetPrice) : 0;
                const hasChange = currentP > 0 && targetP > 0;
                const percentChange = hasChange ? ((targetP - currentP) / currentP) * 100 : 0;
                const isPositive = percentChange >= 0;

                const statusStyles: Record<PlanStatus, string> = {
                  ongoing: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                  done: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
                  expired: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
                  trash: "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400",
                };

                const handleStatusChange = (newStatus: PlanStatus) => {
                  setPlans(prevPlans =>
                    prevPlans.map((p, i) =>
                      i === index ? { ...p, status: newStatus } : p
                    )
                  );
                };

                return (
                  <tr
                    key={index}
                    className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                      plan.status === "trash" ? "opacity-50" : ""
                    }`}
                  >
                    <td className="py-3 px-4 text-zinc-900 dark:text-white">{plan.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-600 dark:text-blue-400">{plan.stockId}</span>
                        {plan.stockName && (
                          <span className="text-zinc-500 dark:text-zinc-400 text-xs truncate max-w-[120px]">{plan.stockName}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                        plan.action === "buy"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      }`}>
                        {plan.action === "buy" ? t("buy").toUpperCase() : t("sell").toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-zinc-900 dark:text-white">{plan.shares}</td>
                    <td className="py-3 px-4 text-right font-medium text-zinc-900 dark:text-white">
                      {plan.targetPrice ? `$${plan.targetPrice}` : "-"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {hasChange ? (
                        <span className={`font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isPositive ? '↑' : '↓'} {isPositive ? '+' : ''}{percentChange.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{plan.deadline || "-"}</td>
                    <td className="py-3 px-4">
                      <select
                        value={plan.status || "ongoing"}
                        onChange={(e) => handleStatusChange(e.target.value as PlanStatus)}
                        className={`px-2 py-1 text-xs font-medium rounded cursor-pointer border-0 ${statusStyles[plan.status || "ongoing"]}`}
                      >
                        <option value="ongoing">{t("ongoing")}</option>
                        <option value="done">{t("done")}</option>
                        <option value="expired">{t("expired")}</option>
                        <option value="trash">{t("trash")}</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
