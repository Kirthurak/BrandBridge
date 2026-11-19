
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const genres = [
  "Sports", "Racing", "Action", "Adventure",
  "Simulation", "Strategy", "RPG", "Shooter",
];

const platforms = [
  "PC", "PlayStation", "Xbox", "Nintendo", "Mobile", "VR",
];

const placements = [
  "Product Placement",
  "Billboards",
  "Vehicles",
  "Stadium Advertising",
  "Virtual Storefront",
  "Sponsored Event",
  "Interactive Experience",
];

export default function GameListing() {
  const router = useRouter();

  const [studio, setStudio] = useState("");
  const [developerId, setDeveloperId] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>([]);
  const [monthlyPlayers, setMonthlyPlayers] = useState("");
  const [audience, setAudience] = useState("");
  const [price, setPrice] = useState("");
  const [funding, setFunding] = useState("");

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [browserCopySaved, setBrowserCopySaved] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDeveloper() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error(
            "Please sign in to your developer account before listing a game."
          );
        }

        const { data, error: profileError } = await supabase
          .from("developers")
          .select("id, studio_name")
          .eq("user_id", user.id)
          .single();

        if (profileError || !data) {
          throw new Error(
            "Developer profile not found. Please complete studio onboarding first."
          );
        }

        if (!active) return;

        setDeveloperId(data.id);
        setStudio(data.studio_name);

        // Keep the original prototype session data compatible.
        const previous = sessionStorage.getItem(
          "brandbridge_developer"
        );

        let previousData: Record<string, unknown> = {};

        if (previous) {
          try {
            const parsed = JSON.parse(previous);
            if (parsed && typeof parsed === "object") {
              previousData = parsed;
            }
          } catch {
            // Ignore invalid old browser data.
          }
        }

        sessionStorage.setItem(
          "brandbridge_developer",
          JSON.stringify({
            ...previousData,
            studio: data.studio_name,
          })
        );
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your developer profile."
          );
        }
      } finally {
        if (active) setLoadingProfile(false);
      }
    }

    loadDeveloper();

    return () => {
      active = false;
    };
  }, []);

  function toggle(
    value: string,
    selected: string[],
    update: (items: string[]) => void
  ) {
    update(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving || saved) return;

    setError("");

    const players = Number(monthlyPlayers);
    const startingPrice = price.trim() ? Number(price) : null;
    const fundingAmount = funding.trim() ? Number(funding) : null;

    if (
      !developerId ||
      !studio ||
      !name.trim() ||
      !description.trim() ||
      selectedGenres.length === 0 ||
      selectedPlatforms.length === 0 ||
      selectedPlacements.length === 0 ||
      !audience.trim() ||
      monthlyPlayers.trim() === "" ||
      !Number.isSafeInteger(players) ||
      players < 0 ||
      (startingPrice !== null &&
        (!Number.isFinite(startingPrice) || startingPrice < 0)) ||
      (fundingAmount !== null &&
        (!Number.isFinite(fundingAmount) || fundingAmount < 0))
    ) {
      setError(
        "Please complete all required fields with valid values."
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      const { data: profile, error: profileError } = await supabase
        .from("developers")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", developerId)
        .single();

      if (profileError || !profile) {
        throw new Error(
          "Your developer profile could not be verified."
        );
      }

      const { data: insertedGame, error: insertError } =
        await supabase
          .from("games")
          .insert({
            developer_id: profile.id,
            name: name.trim(),
            description: description.trim(),
            genres: selectedGenres,
            platforms: selectedPlatforms,
            placements: selectedPlacements,
            monthly_players: players,
            audience: audience.trim(),
            starting_price: startingPrice,
            funding_sought: fundingAmount,
          })
          .select("id")
          .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // The database is the source of truth.
      // Maintain a browser copy for existing prototype features.
      const browserGame = {
        id: insertedGame.id,
        name: name.trim(),
        developer: studio,
        description: description.trim(),
        genres: selectedGenres,
        platforms: selectedPlatforms,
        placements: selectedPlacements,
        monthlyPlayers: players,
        audience: audience.trim(),
        price: startingPrice,
        funding: fundingAmount,
        isDemo: false,
      };

      try {
        const existing = JSON.parse(
          localStorage.getItem("brandbridge_games") || "[]"
        );

        const games = Array.isArray(existing)
          ? existing
          : [];

        const updated = games.filter(
          (game: { id?: string }) =>
            game.id !== insertedGame.id
        );

        updated.push(browserGame);

        localStorage.setItem(
          "brandbridge_games",
          JSON.stringify(updated)
        );
      } catch {
        // The online database save has already succeeded.
        setBrowserCopySaved(false);
      }

      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your game listing."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputStyle =
    "w-full rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none focus:border-blue-500";

  return (
    <main className="min-h-screen bg-[#080b12] text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <a href="/" className="text-2xl font-bold">
          Brand<span className="text-blue-500">Bridge</span>
        </a>

        <a
          href="/developer/onboarding"
          className="text-sm text-gray-400"
        >
          ← Back to studio
        </a>
      </nav>

      <section className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-sm font-semibold text-blue-400">
          DEVELOPER GAME LISTING
        </p>

        <h1 className="mt-4 text-4xl font-bold">
          List your game.
        </h1>

        <p className="mt-4 text-gray-400">
          {studio
            ? `Create an advertising opportunity for ${studio}.`
            : loadingProfile
              ? "Loading your developer profile..."
              : "Create a game listing for BrandBridge."}
        </p>

        {saved ? (
          <div className="mt-10 rounded-3xl border border-green-700 bg-green-950/30 p-8">
            <h2 className="text-2xl font-bold text-green-300">
              Game listing saved!
            </h2>

            <p className="mt-3 text-gray-300">
              {name} has been saved successfully to the
              BrandBridge Supabase database.
            </p>

            {!browserCopySaved && (
              <p className="mt-3 text-amber-300">
                The online save succeeded, but the local browser
                copy could not be updated. Some prototype
                dashboard features may not show this game yet.
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push("/developer/dashboard")
                }
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
              >
                View Developer Dashboard →
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/brand/onboarding")
                }
                className="rounded-xl border border-gray-700 px-6 py-3 font-semibold hover:bg-gray-800"
              >
                Test Brand Matching →
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-10 space-y-7 rounded-3xl border border-gray-800 bg-gray-900/50 p-8"
          >
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm"
              >
                Game name *
              </label>

              <input
                id="name"
                className={inputStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Court Kings"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm"
              >
                Game description *
              </label>

              <textarea
                id="description"
                rows={4}
                className={inputStyle}
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Describe the game and its virtual world."
                required
              />
            </div>

            <div>
              <p className="mb-3 text-sm">Game genres *</p>

              <div className="flex flex-wrap gap-3">
                {genres.map((genre) => (
                  <button
                    type="button"
                    key={genre}
                    onClick={() =>
                      toggle(
                        genre,
                        selectedGenres,
                        setSelectedGenres
                      )
                    }
                    aria-pressed={selectedGenres.includes(genre)}
                    className={`rounded-xl border px-4 py-2 text-sm ${
                      selectedGenres.includes(genre)
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-gray-700 text-gray-400"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm">
                Gaming platforms *
              </p>

              <div className="flex flex-wrap gap-3">
                {platforms.map((platform) => (
                  <button
                    type="button"
                    key={platform}
                    onClick={() =>
                      toggle(
                        platform,
                        selectedPlatforms,
                        setSelectedPlatforms
                      )
                    }
                    aria-pressed={selectedPlatforms.includes(
                      platform
                    )}
                    className={`rounded-xl border px-4 py-2 text-sm ${
                      selectedPlatforms.includes(platform)
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-gray-700 text-gray-400"
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="players"
                className="mb-2 block text-sm"
              >
                Monthly active players *
              </label>

              <input
                id="players"
                type="number"
                min="0"
                step="1"
                className={inputStyle}
                value={monthlyPlayers}
                onChange={(e) =>
                  setMonthlyPlayers(e.target.value)
                }
                placeholder="e.g. 25000"
                required
              />
            </div>

            <div>
              <label
                htmlFor="audience"
                className="mb-2 block text-sm"
              >
                Player audience *
              </label>

              <textarea
                id="audience"
                rows={3}
                className={inputStyle}
                value={audience}
                onChange={(e) =>
                  setAudience(e.target.value)
                }
                placeholder="e.g. Basketball fans aged 18–34 in the United States."
                required
              />
            </div>

            <div>
              <p className="mb-3 text-sm">
                Available advertising placements *
              </p>

              <div className="flex flex-wrap gap-3">
                {placements.map((placement) => (
                  <button
                    type="button"
                    key={placement}
                    onClick={() =>
                      toggle(
                        placement,
                        selectedPlacements,
                        setSelectedPlacements
                      )
                    }
                    aria-pressed={selectedPlacements.includes(
                      placement
                    )}
                    className={`rounded-xl border px-4 py-2 text-sm ${
                      selectedPlacements.includes(placement)
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-gray-700 text-gray-400"
                    }`}
                  >
                    {placement}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="price"
                className="mb-2 block text-sm"
              >
                Starting advertising price (USD)
              </label>

              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                className={inputStyle}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 5000"
              />
            </div>

            <div>
              <label
                htmlFor="funding"
                className="mb-2 block text-sm"
              >
                Funding sought (USD) — optional
              </label>

              <input
                id="funding"
                type="number"
                min="0"
                step="0.01"
                className={inputStyle}
                value={funding}
                onChange={(e) => setFunding(e.target.value)}
                placeholder="e.g. 100000"
              />

              <p className="mt-2 text-xs text-gray-500">
                Reserved for BrandBridge&apos;s future
                developer funding features.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={
                saving ||
                loadingProfile ||
                !developerId
              }
              className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving to Supabase..."
                : loadingProfile
                  ? "Loading developer profile..."
                  : "Save Game Listing →"}
            </button>

            <p className="text-center text-xs text-gray-500">
              Developer setup — Step 2 of 2
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
