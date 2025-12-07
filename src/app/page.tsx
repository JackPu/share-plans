import Plans from "./components/Plans";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            Stock Plans
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Track and manage your stock option plans
          </p>
        </div>
        <Plans />
      </div>
    </main>
  );
}
