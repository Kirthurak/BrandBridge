
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type BrandData = {
  company: string;
  website: string;
  industry: string;
  audience: string;
  budget: string;
};

type CampaignData = {
  objective: string;
  product: string;
  location: string;
  genres: string[];
  platforms: string[];
  placement: string;
};

type Game = {
  id: number;
  name: string;
  developer: string;
  description: string;
  genres: string[];
  platforms: string[];
  audience: string;
  monthlyPlayers: number;
  placements: string[];
  estimatedReach?: string;
  price?: number | null;
  funding?: number | null;
  isDemo?: boolean;
};

type MatchResult = Game & {
  score: number;
  reasons: string[];
  recommendedPlacement: string;
  confidence: "High" | "Medium" | "Low";
  budgetStatus: string;
};

type SavedMatch = {
  id: number;
  name: string;
  studio: string;
  score: number;
  monthlyPlayers: number;
  price: number | null;
};

const demoGames: Game[] = [
  {
    id: 1,
    name: "Court Kings",
    developer: "Northstar Interactive",
    description:
      "A competitive basketball game built around online leagues, custom athletes, and arena experiences.",
    genres: ["Sports", "Simulation"],
    platforms: ["PC", "PlayStation", "Xbox"],
    audience: "Sports fans and competitive gamers aged 16–34.",
    monthlyPlayers: 850000,
    placements: [
      "Product Placement",
      "Stadium Advertising",
      "Interactive Experience",
    ],
    estimatedReach: "420K–680K",
    price: 5000,
    isDemo: true,
  },
  {
    id: 2,
    name: "Velocity District",
    developer: "Apex Road Studios",
    description:
      "An open-world racing title featuring competitive events and vehicle customisation.",
    genres: ["Racing", "Simulation"],
    platforms: ["PC", "PlayStation", "Xbox"],
    audience: "Racing fans and gamers aged 18–35.",
    monthlyPlayers: 620000,
    placements: [
      "Billboards",
      "Product Placement",
      "Vehicles",
      "Sponsored Event",
    ],
    estimatedReach: "280K–510K",
    price: 7500,
    isDemo: true,
  },
  {
    id: 3,
    name: "Metro Life",
    developer: "Parallel Worlds",
    description:
      "A social simulation game featuring virtual cities, custom characters, and digital shops.",
    genres: ["Simulation", "Adventure"],
    platforms: ["PC", "Mobile"],
    audience: "Social gamers and lifestyle audiences aged 16–30.",
    monthlyPlayers: 1100000,
    placements: [
      "Product Placement",
      "Virtual Storefront",
      "Interactive Experience",
    ],
    estimatedReach: "500K–800K",
    price: 10000,
    isDemo: true,
  },
  {
    id: 4,
    name: "Strikepoint",
    developer: "Iron Gate Games",
    description:
      "A competitive team-based action game with seasonal events and multiplayer gameplay.",
    genres: ["Action", "Shooter"],
    platforms: ["PC", "PlayStation", "Xbox"],
    audience: "Competitive gamers aged 18–34.",
    monthlyPlayers: 1400000,
    placements: ["Billboards", "Sponsored Event"],
    estimatedReach: "550K–900K",
    price: 12000,
    isDemo: true,
  },
];

function getBudgetMaximum(budget: string): number | null {
  const ranges: Record<string, number | null> = {
    "Under $5,000": 5000,
    "$5,000 – $25,000": 25000,
    "$25,000 – $100,000": 100000,
    "$100,000 – $500,000": 500000,
    "$500,000+": null,
    "Not sure yet": null,
  };

  return ranges[budget] ?? null;
}

function calculateMatch(
  game: Game,
  campaign: CampaignData,
  brand: BrandData
): MatchResult {
  let score = 20;
  const reasons: string[] = [];

  const matchingGenres = game.genres.filter((genre) =>
    campaign.genres.includes(genre)
  );

  if (matchingGenres.length > 0) {
    score += Math.min(matchingGenres.length * 15, 30);
    reasons.push(
      `${matchingGenres.join(" and ")} matches your preferred game genres.`
    );
  }

  const matchingPlatforms = game.platforms.filter((platform) =>
    campaign.platforms.includes(platform)
  );

  if (matchingPlatforms.length > 0) {
    score += Math.min(matchingPlatforms.length * 7, 21);
    reasons.push(
      `Available on ${matchingPlatforms.join(", ")}, matching your preferred platforms.`
    );
  }

  if (
    campaign.placement &&
    game.placements.includes(campaign.placement)
  ) {
    score += 12;
    reasons.push(
      `${campaign.placement} is available in this game.`
    );
  }

  if (
    campaign.objective === "Product Launch" &&
    game.placements.includes("Product Placement")
  ) {
    score += 7;
    reasons.push(
      "Product placement could support your new-product launch."
    );
  }

  const budgetMaximum = getBudgetMaximum(brand.budget);
  let budgetStatus = "Budget not evaluated";

  if (game.price != null && budgetMaximum != null) {
    if (game.price <= budgetMaximum) {
      score += 10;
      budgetStatus = "Within stated budget ceiling";
      reasons.push(
        "The listed starting price is within your campaign budget ceiling."
      );
    } else {
      budgetStatus = "Above stated budget ceiling";
      reasons.push(
        "The starting price exceeds your stated campaign budget ceiling."
      );
    }
  } else if (game.price != null) {
    budgetStatus = "Price available — budget requires review";
  }

  score = Math.max(0, Math.min(score, 98));

  const recommendedPlacement =
    campaign.placement &&
    game.placements.includes(campaign.placement)
      ? campaign.placement
      : game.placements[0] || "Contact developer";

  return {
    ...game,
    score,
    reasons,
    recommendedPlacement,
    budgetStatus,
    confidence:
      score >= 80 ? "High" : score >= 55 ? "Medium" : "Low",
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function readSavedMatches(): SavedMatch[] {
  try {
    const stored = JSON.parse(
      localStorage.getItem("brandbridge_saved_matches") || "[]"
    );

    if (!Array.isArray(stored)) return [];

    return stored.filter(
      (item): item is SavedMatch =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "number" &&
        typeof item.name === "string"
    );
  } catch {
    return [];
  }
}

export default function BrandMatches() {
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([]);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      try {
        const savedBrand =
          sessionStorage.getItem("brandbridge_brand") ||
          localStorage.getItem("brandbridge_brand");
        const savedCampaign =
          sessionStorage.getItem("brandbridge_campaign") ||
          localStorage.getItem("brandbridge_campaign");

        const browserBrand: Partial<BrandData> = savedBrand
          ? JSON.parse(savedBrand)
          : {};
        const campaignData: CampaignData | null = savedCampaign
          ? JSON.parse(savedCampaign)
          : null;

        // The company profile is owned by the signed-in brand user.
        // Browser storage is only a fallback for the prototype's extra fields.
        let company = browserBrand.company || "";
        let website = browserBrand.website || "";
        let industry = browserBrand.industry || "";
        let audience = browserBrand.audience || "";
        let budget = browserBrand.budget || "";

        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          const { data: profile, error: profileError } = await supabase
            .from("brands")
            .select("brand_name, website, industry, description")
            .eq("user_id", authData.user.id)
            .maybeSingle();

          if (profileError) {
            console.error("Unable to load brand profile:", profileError);
          } else if (profile) {
            company = profile.brand_name || company;
            website = profile.website || website;
            industry = profile.industry || industry;
            audience = profile.description || audience;
          }
        }

        // Campaigns are still prototype browser data; don't invent one.
        if (!company || !campaignData) return;
        if (
          !campaignData.objective ||
          !Array.isArray(campaignData.genres) ||
          !Array.isArray(campaignData.platforms)
        ) return;

        const brandData: BrandData = {
          company,
          website,
          industry,
          audience,
          budget,
        };

        // Keep the legacy storage format for other prototype pages.
        sessionStorage.setItem("brandbridge_brand", JSON.stringify(brandData));
        localStorage.setItem("brandbridge_brand", JSON.stringify(brandData));
        sessionStorage.setItem("brandbridge_campaign", JSON.stringify(campaignData));

        const storedGames = JSON.parse(
          localStorage.getItem("brandbridge_games") || "[]"
        );

        const developerGames: Game[] = Array.isArray(storedGames)
          ? storedGames.filter(
              (game): game is Game =>
                game !== null &&
                typeof game === "object" &&
                typeof game.id === "number" &&
                typeof game.name === "string" &&
                typeof game.developer === "string" &&
                Array.isArray(game.genres) &&
                Array.isArray(game.platforms) &&
                Array.isArray(game.placements)
            )
          : [];

        const availableGames =
          developerGames.length > 0 ? developerGames : demoGames;
        const results = availableGames
          .map((game) => calculateMatch(game, campaignData, brandData))
          .sort((a, b) => b.score - a.score);

        if (!cancelled) {
          setBrand(brandData);
          setCampaign(campaignData);
          setMatches(results);
          setSavedMatches(readSavedMatches());
        }
      } catch (error) {
        console.error("Unable to load BrandBridge data:", error);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    void loadMatches();
    return () => { cancelled = true; };
  }, []);

  function toggleSavedMatch(game: MatchResult) {
    const alreadySaved = savedMatches.some(
      (match) => match.id === game.id
    );

    const updated: SavedMatch[] = alreadySaved
      ? savedMatches.filter((match) => match.id !== game.id)
      : [
          ...savedMatches,
          {
            id: game.id,
            name: game.name,
            studio: game.developer,
            score: game.score,
            monthlyPlayers: game.monthlyPlayers,
            price: game.price ?? null,
          },
        ];

    setSavedMatches(updated);

    localStorage.setItem(
      "brandbridge_saved_matches",
      JSON.stringify(updated)
    );
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080b12] text-white">
        Loading game matches...
      </main>
    );
  }

  if (!brand || !campaign) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080b12] px-6 text-white">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-bold">
            Campaign information not found.
          </h1>
          <p className="mt-4 text-gray-400">
            Complete the brand onboarding and campaign goals before
            viewing your matches.
          </p>
          <a
            href="/brand/onboarding"
            className="mt-8 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold"
          >
            Start Brand Onboarding
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080b12] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="/" className="text-2xl font-bold">
          Brand<span className="text-blue-500">Bridge</span>
        </a>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href="/brand/dashboard"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Brand Dashboard
          </a>
          <a
            href="/brand/campaign"
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Edit campaign
          </a>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        <p className="text-sm font-semibold text-blue-400">
          GAME MATCHES
        </p>

        <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
          Your strongest gaming opportunities.
        </h1>

        <p className="mt-5 max-w-3xl text-lg text-gray-400">
          BrandBridge ranked the available game listings using the
          campaign preferences provided by {brand.company}.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {[campaign.objective, campaign.location, brand.budget]
            .filter(Boolean)
            .map((item) => (
              <span
                key={item}
                className="rounded-full border border-gray-800 bg-gray-900 px-4 py-2 text-sm text-gray-300"
              >
                {item}
              </span>
            ))}
        </div>

        <div className="mt-12 space-y-6">
          {matches.map((game, index) => {
            const isSaved = savedMatches.some(
              (match) => match.id === game.id
            );

            return (
              <article
                key={game.id}
                className="rounded-3xl border border-gray-800 bg-gray-900/50 p-7"
              >
                <div className="flex flex-col justify-between gap-6 lg:flex-row">
                  <div className="max-w-3xl">
                    <div className="mb-3 flex flex-wrap gap-3">
                      {index === 0 && (
                        <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300">
                          BEST MATCH
                        </span>
                      )}

                      <span className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-400">
                        Prototype listing
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold">
                      {game.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      by {game.developer}
                    </p>

                    <p className="mt-4 leading-7 text-gray-400">
                      {game.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {[...game.genres, ...game.platforms].map(
                        (item) => (
                          <span
                            key={item}
                            className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-300"
                          >
                            {item}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="min-w-40 lg:text-right">
                    <p className="text-4xl font-bold text-blue-400">
                      {game.score}%
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Compatibility score
                    </p>

                    <p className="mt-4 text-sm text-gray-300">
                      {game.confidence} scoring tier
                    </p>
                  </div>
                </div>

                <div className="my-7 border-t border-gray-800" />

                <div className="grid gap-8 lg:grid-cols-3">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Why it matches
                    </h3>

                    <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-400">
                      {game.reasons.length > 0 ? (
                        game.reasons.map((reason, reasonIndex) => (
                          <li key={reasonIndex}>• {reason}</li>
                        ))
                      ) : (
                        <li>
                          Further review is needed to determine
                          campaign fit.
                        </li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">
                      Recommended placement
                    </h3>

                    <p className="mt-3 text-lg font-medium">
                      {game.recommendedPlacement}
                    </p>

                    <p className="mt-3 text-sm text-gray-500">
                      {game.budgetStatus}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">
                      Advertising opportunity
                    </h3>

                    <p className="mt-3 text-lg font-medium">
                      {game.price != null
                        ? `From ${formatCurrency(game.price)}`
                        : "Price on request"}
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      {game.monthlyPlayers.toLocaleString()} reported
                      monthly active players
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      Developer-entered or fictional test figures;
                      not independently verified.
                    </p>
                  </div>
                </div>

                {selectedGame === game.id && (
                  <div className="mt-7 rounded-2xl border border-gray-700 bg-[#0d111a] p-6">
                    <h3 className="text-lg font-semibold">
                      Opportunity details
                    </h3>

                    <p className="mt-3 text-sm text-gray-400">
                      <strong>Player audience:</strong>{" "}
                      {game.audience}
                    </p>

                    <p className="mt-3 text-sm text-gray-400">
                      <strong>Available placements:</strong>{" "}
                      {game.placements.join(", ")}
                    </p>

                    <p className="mt-3 text-sm text-gray-400">
                      <strong>Developer:</strong>{" "}
                      {game.developer}
                    </p>

                    {game.funding != null && (
                      <p className="mt-3 text-sm text-gray-400">
                        <strong>Funding sought:</strong>{" "}
                        {formatCurrency(game.funding)}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-7 flex flex-wrap gap-3 border-t border-gray-800 pt-6">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedGame(
                        selectedGame === game.id ? null : game.id
                      )
                    }
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
                  >
                    {selectedGame === game.id
                      ? "Hide Opportunity"
                      : "View Opportunity"}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSavedMatch(game)}
                    className="rounded-xl border border-gray-700 px-5 py-3 text-sm font-semibold text-gray-300 hover:border-blue-500"
                  >
                    {isSaved ? "✓ Saved" : "Save Match"}
                  </button>

                  {isSaved && (
                    <a
                      href="/brand/dashboard"
                      className="rounded-xl border border-blue-500/40 px-5 py-3 text-sm font-semibold text-blue-300 hover:border-blue-400"
                    >
                      View Saved Matches →
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {matches.length === 0 && (
          <div className="mt-10 rounded-2xl border border-gray-800 p-8 text-gray-400">
            No game listings are currently available.
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
          <p className="text-sm leading-6 text-yellow-100/80">
            Prototype notice: Listings are currently stored in this
            browser. Sample games and their statistics are fictional.
            Developer-entered information has not been verified.
            Compatibility scores are rule-based, not AI predictions,
            and do not represent campaign success probabilities.
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-gray-600">
          Step 3 of 3
        </p>
      </section>
    </main>
  );
}
