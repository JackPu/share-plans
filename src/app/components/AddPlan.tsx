"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../i18n/LanguageContext";

interface AddPlanProps {
  setPlans: React.Dispatch<React.SetStateAction<Plan[]>>;
  isOpen: boolean;
  onClose: () => void;
}

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

interface StockSuggestion {
  symbol: string;
  name: string;
  exchange: string;
}

interface StockPrice {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  currency: string;
  marketState: string;
}

export default function AddPlan({ setPlans, isOpen, onClose }: AddPlanProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [shares, setShares] = useState("");
  const [stockName, setStockName] = useState("");
  const [stockId, setStockId] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [deadline, setDeadline] = useState("");
  const [action, setAction] = useState<"buy" | "sell">("buy");

  // Stock suggestions state
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Stock price state
  const [stockPrice, setStockPrice] = useState<StockPrice | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Fetch stock suggestions when stockName changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (stockName.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(stockName)}`);
        const data = await response.json();
        setSuggestions(data.stocks || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("11111 Error fetching stock suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [stockName]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch stock price
  const fetchStockPrice = async (symbol: string) => {
    setIsPriceLoading(true);
    setPriceError(null);
    setStockPrice(null);

    try {
      const response = await fetch(`/api/stocks/price?symbol=${encodeURIComponent(symbol)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch price");
      }

      setStockPrice(data);
    } catch (error) {
      console.error("11111 Error fetching stock price:", error);
      setPriceError(t("unableToFetchPrice"));
    } finally {
      setIsPriceLoading(false);
    }
  };

  const handleSelectStock = (stock: StockSuggestion) => {
    setStockName(stock.name);
    setStockId(stock.symbol);
    setShowSuggestions(false);
    // Fetch real-time price
    fetchStockPrice(stock.symbol);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-generate plan name if empty: stockName + action + shares
    const planName = name.trim() || `${stockName || stockId} ${action === "buy" ? t("buy") : t("sell")} ${shares}`;

    const newPlan: Plan = {
      name: planName,
      shares,
      stockName,
      stockId,
      targetPrice,
      deadline,
      currentPrice: stockPrice?.price?.toFixed(2),
      action,
      status: "ongoing",
    };
    setPlans((prevPlans) => [...prevPlans, newPlan]);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName("");
    setShares("");
    setStockName("");
    setStockId("");
    setTargetPrice("");
    setDeadline("");
    setAction("buy");
    setSuggestions([]);
    setShowSuggestions(false);
    setStockPrice(null);
    setPriceError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            {t("addNewPlan")}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Stock Name & Stock ID */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative" ref={suggestionRef}>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("stockName")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={t("searchStocks")}
                    value={stockName}
                    onChange={(e) => {
                      setStockName(e.target.value);
                      setStockPrice(null);
                      setPriceError(null);
                    }}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  />
                  {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((stock, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-700 last:border-b-0"
                        onClick={() => handleSelectStock(stock)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-zinc-900 dark:text-white truncate">
                            {stock.name}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {stock.exchange}
                          </div>
                        </div>
                        <span className="flex-shrink-0 px-2 py-1 text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          {stock.symbol}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("stockSymbol")}
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., AAPL"
                  value={stockId}
                  onChange={(e) => setStockId(e.target.value)}
                />
              </div>
            </div>

            {/* Real-time Price Display */}
            {(isPriceLoading || stockPrice || priceError) && (
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                {isPriceLoading ? (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm">{t("fetchingPrice")}</span>
                  </div>
                ) : priceError ? (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm">{priceError}</span>
                  </div>
                ) : stockPrice && (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                        {t("currentPrice")} ({stockPrice.symbol})
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                          ${stockPrice.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {stockPrice.currency}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${stockPrice.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stockPrice.change >= 0 ? '+' : ''}{stockPrice.change.toFixed(2)}
                      </div>
                      <div className={`text-sm ${stockPrice.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        ({stockPrice.changePercent >= 0 ? '+' : ''}{stockPrice.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Target Price & Deadline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("targetPrice")}
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="150.00"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                />
                {/* Target Price Percentage Change */}
                {stockPrice && targetPrice && (
                  (() => {
                    const currentP = stockPrice.price;
                    const targetP = parseFloat(targetPrice);
                    if (!isNaN(targetP) && currentP > 0) {
                      const percentChange = ((targetP - currentP) / currentP) * 100;
                      const isPositive = percentChange >= 0;
                      return (
                        <div className={`mt-2 text-sm font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isPositive ? '↑' : '↓'} {isPositive ? '+' : ''}{percentChange.toFixed(2)}% {t("fromCurrentPrice")}
                        </div>
                      );
                    }
                    return null;
                  })()
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("deadline")}
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            {/* Action (Buy/Sell) & Shares */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("action")}
                </label>
                <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-600 overflow-hidden">
                  <button
                    type="button"
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                      action === "buy"
                        ? "bg-emerald-500 text-white"
                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                    }`}
                    onClick={() => setAction("buy")}
                  >
                    {t("buy")}
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                      action === "sell"
                        ? "bg-red-500 text-white"
                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                    }`}
                    onClick={() => setAction("sell")}
                  >
                    {t("sell")}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("shares")}
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="1000"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Plan Name (optional) */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t("planName")} <span className="text-zinc-400 font-normal">{t("planNameOptional")}</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t("autoGenerated")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              {t("addPlan")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
