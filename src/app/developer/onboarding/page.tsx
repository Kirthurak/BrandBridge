
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DeveloperOnboarding() {
  const router = useRouter();

  const [studio, setStudio] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [about, setAbout] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      !studio.trim() ||
      !location.trim() ||
      !teamSize ||
      !about.trim()
    ) {
      setError("Please complete all required fields before continuing.");
      return;
    }

    setSaving(true);

    try {
      // Identify the signed-in developer.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError(
          "Please sign in to your developer account before continuing."
        );
        return;
      }

      // Save the studio profile in Supabase.
      // The user_id is unique, so completing onboarding
      // again updates the same developer profile.
      const { error: saveError } = await supabase
        .from("developers")
        .upsert(
          {
            user_id: user.id,
            studio_name: studio.trim(),
            website: website.trim() || null,
            location: location.trim(),
            team_size: teamSize,
            about: about.trim(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (saveError) {
        throw saveError;
      }

      // Preserve the existing BrandBridge workflow.
      const developerData = {
        studio: studio.trim(),
        website: website.trim(),
        location: location.trim(),
        teamSize,
        about: about.trim(),
      };

      sessionStorage.setItem(
        "brandbridge_developer",
        JSON.stringify(developerData)
      );

      router.push("/developer/game");
    } catch (err) {
      console.error("Developer onboarding error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your studio. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080b12] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Brand<span className="text-blue-500">Bridge</span>
        </a>

        <a
          href="/"
          className="text-sm text-gray-400 transition hover:text-white"
        >
          ← Back to home
        </a>
      </nav>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <div className="mb-4 text-sm font-medium text-blue-400">
            DEVELOPER ONBOARDING
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Tell us about your studio.
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-400">
            Create your developer profile before listing games and advertising
            opportunities on BrandBridge.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-7 rounded-3xl border border-gray-800 bg-gray-900/50 p-8"
        >
          <div>
            <label
              htmlFor="studio"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Studio or developer name *
            </label>

            <input
              id="studio"
              type="text"
              value={studio}
              onChange={(event) => setStudio(event.target.value)}
              placeholder="e.g. Northstar Interactive"
              className="w-full rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="website"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Studio website
            </label>

            <input
              id="website"
              type="url"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://yourstudio.com"
              className="w-full rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Location *
            </label>

            <input
              id="location"
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g. New York, United States"
              className="w-full rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="teamSize"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Team size *
            </label>

            <select
              id="teamSize"
              value={teamSize}
              onChange={(event) => setTeamSize(event.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              <option value="">Select team size</option>
              <option value="Solo developer">Solo developer</option>
              <option value="2–10">2–10 people</option>
              <option value="11–50">11–50 people</option>
              <option value="51–200">51–200 people</option>
              <option value="201+">201+ people</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="about"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              About your studio *
            </label>

            <textarea
              id="about"
              rows={4}
              value={about}
              onChange={(event) => setAbout(event.target.value)}
              placeholder="Tell brands about your studio, the games you build, and your audience."
              className="w-full resize-none rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="border-t border-gray-800 pt-7">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-blue-600 px-6 py-3.5 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving your studio..."
                : "Continue to Game Listing →"}
            </button>

            <p className="mt-4 text-center text-xs text-gray-600">
              Developer setup — Step 1 of 2
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
