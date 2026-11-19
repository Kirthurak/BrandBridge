export default function Home() {
  return (
    <main className="min-h-screen bg-[#080b12] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Brand<span className="text-blue-500">Bridge</span>
        </a>

        <div className="flex items-center gap-6">
          <a
            href="#marketplace"
            className="text-sm text-gray-300 transition hover:text-white"
          >
            Marketplace
          </a>

          <a
            href="#developers"
            className="text-sm text-gray-300 transition hover:text-white"
          >
            For Developers
          </a>

          <button className="rounded-full border border-gray-700 px-5 py-2 text-sm transition hover:bg-white hover:text-black">
            Sign In
          </button>
        </div>
      </nav>

      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 pb-32 pt-28 text-center">
        <div className="mb-6 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
          AI-powered gaming partnerships
        </div>

        <h1 className="max-w-5xl text-5xl font-bold tracking-tight sm:text-7xl">
          Where brands and
          <span className="text-blue-500"> games </span>
          find each other.
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-8 text-gray-400">
          BrandBridge connects brands with game developers through intelligent
          matching, in-game advertising opportunities, and campaign
          forecasting.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="/brand/onboarding"
            className="rounded-full bg-blue-600 px-7 py-3 font-semibold transition hover:bg-blue-500"
          >
            I&apos;m a Brand
          </a>

          <a
            href="/developer/onboarding"
            className="rounded-full border border-gray-700 px-7 py-3 font-semibold transition hover:border-gray-500 hover:bg-gray-900"
          >
            I&apos;m a Game Developer
          </a>
        </div>

        <div
          id="marketplace"
          className="mt-24 grid w-full max-w-4xl gap-4 text-left md:grid-cols-3"
        >
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="mb-4 text-2xl">🎯</div>

            <h2 className="text-lg font-semibold">Smart Matching</h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Match campaigns with games based on audience, genre, platform,
              goals, and budget.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="mb-4 text-2xl">🎮</div>

            <h2 className="text-lg font-semibold">Game Marketplace</h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Discover advertising opportunities inside games and connect
              directly with developers.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="mb-4 text-2xl">📈</div>

            <h2 className="text-lg font-semibold">Campaign Forecasts</h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Estimate campaign reach and performance before committing your
              advertising budget.
            </p>
          </div>
        </div>

        <div
          id="developers"
          className="mt-24 w-full max-w-4xl rounded-3xl border border-gray-800 bg-gray-900/40 p-8 text-left sm:p-10"
        >
          <div className="text-sm font-medium text-blue-400">
            FOR GAME DEVELOPERS
          </div>

          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Turn your game world into a business opportunity.
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-gray-400">
            List your game, describe your audience, offer advertising
            placements, and let BrandBridge connect your studio with brands
            looking for suitable gaming partnerships.
          </p>

          <a
            href="/developer/onboarding"
            className="mt-7 inline-block rounded-xl border border-gray-700 px-6 py-3 font-semibold transition hover:border-blue-500 hover:bg-blue-500/10"
          >
            List Your Game →
          </a>
        </div>
      </section>
    </main>
  );
}