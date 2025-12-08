"use client";

import { useLanguage } from "../i18n/LanguageContext";
import Plans from "./Plans";

export default function HomeContent() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Language Switch */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-lg border border-zinc-300 dark:border-zinc-600 overflow-hidden text-sm">
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1.5 transition-colors ${
                language === "en"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("zh")}
              className={`px-3 py-1.5 transition-colors ${
                language === "zh"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              }`}
            >
              中文
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {t("pageTitle")}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            {t("pageSubtitle")}
          </p>
        </div>

        <Plans />
      </div>
    </main>
  );
}

