
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type CampaignData = {
  objective: string;
  product: string;
  location: string;
  genres: string[];
  platforms: string[];
  placement: string;
};

export default function CampaignGoals() {
  const router = useRouter();

  const [company, setCompany] = useState("");
  const [objective, setObjective] = useState("");
  const [product, setProduct] = useState("");
  const [location, setLocation] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [placement, setPlacement] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function restoreSavedInformation() {
      try {
        const savedBrand =
          sessionStorage.getItem("brandbridge_brand") ||
          localStorage.getItem("brandbridge_brand");

        if (savedBrand) {
          const brand = JSON.parse(savedBrand);
          setCompany(brand.company || "");
        }

        const savedCampaign =
          sessionStorage.getItem("brandbridge_campaign") ||
          localStorage.getItem("brandbridge_campaign");

        if (savedCampaign) {
          const campaign = JSON.parse(savedCampaign);

          setObjective(campaign.objective || "");
          setProduct(campaign.product || "");
          setLocation(campaign.location || "");
          setGenres(
            Array.isArray(campaign.genres)
              ? campaign.genres
              : []
          );
          setPlatforms(
            Array.isArray(campaign.platforms)
              ? campaign.platforms
              : []
          );
          setPlacement(campaign.placement || "");
        }
      } catch (err) {
        console.error("Unable to restore saved campaign:", err);
      }
    }

    async function loadBrandFromSupabase() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) return;

        const { data, error: brandError } = await supabase
          .from("brands")
          .select("brand_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (brandError) {
          console.error("Unable to load brand profile:", brandError);
          return;
        }

        if (data?.brand_name) {
          setCompany(data.brand_name);
        }
      } catch (err) {
        console.error("Supabase brand lookup failed:", err);
      }
    }

    restoreSavedInformation();
    void loadBrandFromSupabase();
  }, []);

  function toggleGenre(genre: string) {
    setGenres((currentGenres) =>
      currentGenres.includes(genre)
        ? currentGenres.filter((item) => item !== genre)
        : [...currentGenres, genre]
    );
  }

  function togglePlatform(platform: string) {
    setPlatforms((currentPlatforms) =>
      currentPlatforms.includes(platform)
        ? currentPlatforms.filter((item) => item !== platform)
        : [...currentPlatforms, platform]
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      !objective ||
      !product.trim() ||
      !location.trim() ||
      genres.length === 0 ||
      platforms.length === 0
    ) {
      setError("Please complete all required campaign fields.");
      return;
    }

    const campaignData: CampaignData = {
      objective,
      product: product.trim(),
      location: location.trim(),
      genres,
      platforms,
      placement,
    };

    try {
      const serialized = JSON.stringify(campaignData);

      sessionStorage.setItem("brandbridge_campaign", serialized);
      localStorage.setItem("brandbridge_campaign", serialized);

      // Preserve the existing brand profile when moving
      // between campaign and game matching pages.
      const savedBrand =
        sessionStorage.getItem("brandbridge_brand") ||
        localStorage.getItem("brandbridge_brand");

      if (savedBrand) {
        sessionStorage.setItem("brandbridge_brand", savedBrand);
        localStorage.setItem("brandbridge_brand", savedBrand);
      }

      router.push("/brand/matches");
    } catch {
      setError(
        "Unable to save your campaign. Please check your browser settings."
      );
    }
  }

  const gameGenres = [
    "Sports",
    "Racing",
    "Action",
    "Adventure",
    "Simulation",
    "Strategy",
    "RPG",
    "Shooter",
  ];

  const gamingPlatforms = [
    "PC",
    "PlayStation",
    "Xbox",
    "Nintendo",
    "Mobile",
    "VR",
  ];

  return (
    <main className="min-h-screen bg-[#080b12] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Brand<span className="text-blue-500">Bridge</span>
        </a>

        <a
          href="/brand/onboarding"
          className="text-sm text-gray-400 transition hover:text-white"
        >
          ← Back
        </a>
      </nav>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <div className="mb-4 text-sm font-medium text-blue-400">
            CAMPAIGN GOALS
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            What do you want to achieve?
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-400">
            {company
              ? `Let's find gaming opportunities that make sense for ${company}.`
              : "Tell BrandBridge what you want your campaign to accomplish."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-3xl border border-gray-800 bg-gray-900/50 p-8"
        >
          <div>
            <label
              htmlFor="objective"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Primary campaign objective *
            </label>

            <select
              id="objective"
              required
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              <option value="">Select an objective</option>
              <option value="Brand Awareness">Brand Awareness</option>
              <option value="Product Launch">Product Launch</option>
              <option value="Drive Sales">Drive Sales</option>
              <option value="Reach New Audiences">
                Reach New Audiences
              </option>
              <option value="Increase Engagement">
                Increase Engagement
              </option>
              <option value="Event Promotion">Event Promotion</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="product"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              What are you promoting? *
            </label>

            <textarea
              id="product"
              rows={3}
              required
              value={product}
              onChange={(event) => setProduct(event.target.value)}
              placeholder="For example: A new basketball shoe designed for young athletes."
              className="w-full resize-none rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Target market *
            </label>

            <input
              id="location"
              type="text"
              required
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g. United States, Europe, Global"
              className="w-full rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-gray-200">
              Preferred game genres *
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {gameGenres.map((genre) => {
                const selected = genres.includes(genre);

                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`rounded-xl border px-4 py-3 text-sm transition ${
                      selected
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-gray-700 bg-[#0d111a] text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-gray-200">
              Preferred platforms *
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gamingPlatforms.map((platform) => {
                const selected = platforms.includes(platform);

                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`rounded-xl border px-4 py-3 text-sm transition ${
                      selected
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-gray-700 bg-[#0d111a] text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    {platform}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="placement"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Preferred advertising placement
            </label>

            <select
              id="placement"
              value={placement}
              onChange={(event) => setPlacement(event.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              <option value="">Let BrandBridge recommend one</option>
              <option value="Billboards">In-game billboards</option>
              <option value="Product Placement">Product placement</option>
              <option value="Vehicles">Branded vehicles</option>
              <option value="Stadium Advertising">
                Stadium / arena advertising
              </option>
              <option value="Virtual Storefront">
                Virtual storefront
              </option>
              <option value="Sponsored Event">Sponsored event</option>
              <option value="Interactive Experience">
                Interactive branded experience
              </option>
            </select>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="border-t border-gray-800 pt-7">
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-6 py-3.5 font-semibold transition hover:bg-blue-500"
            >
              Find My Game Matches →
            </button>

            <p className="mt-4 text-center text-xs text-gray-600">
              Step 2 of 3
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
