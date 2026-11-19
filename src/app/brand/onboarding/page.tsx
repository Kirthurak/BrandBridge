
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type BrandForm = {
  company: string;
  website: string;
  industry: string;
  audience: string;
  budget: string;
};

export default function BrandOnboarding() {
  const router = useRouter();

  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Restore existing form values without changing saved campaigns.
    const stored = sessionStorage.getItem("brandbridge_brand");

    if (!stored) return;

    try {
      const data = JSON.parse(stored) as Partial<BrandForm>;

      setCompany(data.company ?? "");
      setWebsite(data.website ?? "");
      setIndustry(data.industry ?? "");
      setAudience(data.audience ?? "");
      setBudget(data.budget ?? "");
    } catch {
      // Ignore malformed browser data.
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      !company.trim() ||
      !industry ||
      !audience.trim() ||
      !budget
    ) {
      setError("Please complete all required fields before continuing.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError(
          "Please sign in to your BrandBridge brand account before continuing."
        );
        return;
      }

      if (user.user_metadata?.account_type !== "brand") {
        setError(
          "You are signed in with a developer account. Please sign in with your brand account."
        );
        return;
      }

      const brandData: BrandForm = {
        company: company.trim(),
        website: website.trim(),
        industry,
        audience: audience.trim(),
        budget,
      };

      // Store the company profile in Supabase, associated with
      // the currently authenticated brand user.
      const { error: saveError } = await supabase
        .from("brands")
        .upsert(
          {
            user_id: user.id,
            brand_name: brandData.company,
            website: brandData.website,
            industry: brandData.industry,
            description: brandData.audience,
          },
          {
            onConflict: "user_id",
          }
        );

      if (saveError) {
        throw new Error(saveError.message);
      }

      // Preserve the existing campaign workflow.
      // Audience and budget remain in browser storage for now.
      sessionStorage.setItem(
        "brandbridge_brand",
        JSON.stringify(brandData)
      );

      router.push("/brand/campaign");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your brand profile. Please try again."
      );
    } finally {
      setLoading(false);
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
            BRAND ONBOARDING
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Tell us about your brand.
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-400">
            BrandBridge uses this information to understand your company and
            recommend gaming partnerships that fit your audience, goals, and
            budget.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-900/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-7">
            <div>
              <label
                htmlFor="company"
                className="mb-2 block text-sm font-medium text-gray-200"
              >
                Company name *
              </label>

              <input
                id="company"
                type="text"
                required
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="e.g. Nike"
                className="w-full rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="website"
                className="mb-2 block text-sm font-medium text-gray-200"
              >
                Company website
              </label>

              <input
                id="website"
                type="url"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://yourcompany.com"
                className="w-full rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="industry"
                className="mb-2 block text-sm font-medium text-gray-200"
              >
                Industry *
              </label>

              <select
                id="industry"
                required
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                className="w-full rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none transition focus:border-blue-500"
              >
                <option value="">Select an industry</option>
                <option value="Technology">Technology</option>
                <option value="Fashion & Apparel">Fashion & Apparel</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Automotive">Automotive</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Sports & Fitness">Sports & Fitness</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Consumer Products">Consumer Products</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="audience"
                className="mb-2 block text-sm font-medium text-gray-200"
              >
                Target audience *
              </label>

              <textarea
                id="audience"
                rows={4}
                required
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                placeholder="For example: US gamers aged 18–34 interested in sports and streetwear."
                className="w-full resize-none rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="budget"
                className="mb-2 block text-sm font-medium text-gray-200"
              >
                Estimated campaign budget *
              </label>

              <select
                id="budget"
                required
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                className="w-full rounded-xl border border-gray-700 bg-[#0d111a] px-4 py-3 text-white outline-none transition focus:border-blue-500"
              >
                <option value="">Select a budget range</option>
                <option value="Under $5,000">Under $5,000</option>
                <option value="$5,000 – $25,000">$5,000 – $25,000</option>
                <option value="$25,000 – $100,000">
                  $25,000 – $100,000
                </option>
                <option value="$100,000 – $500,000">
                  $100,000 – $500,000
                </option>
                <option value="$500,000+">$500,000+</option>
                <option value="Not sure yet">Not sure yet</option>
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
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-6 py-3.5 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Saving your brand profile..."
                  : "Continue to Campaign Goals →"}
              </button>

              <p className="mt-4 text-center text-xs text-gray-600">
                Step 1 of 3
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
