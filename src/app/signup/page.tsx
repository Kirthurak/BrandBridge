
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type AccountType = "brand" | "developer";

export default function SignupPage() {
  const [accountType, setAccountType] = useState<AccountType>("brand");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    if (password.length < 12) {
      setMessage("Please use a password with at least 12 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            account_type: accountType,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session) {
        setMessage(
          "Account created successfully! You can now continue to login."
        );
      } else {
        setMessage(
          "Registration submitted. Please check your email for a confirmation link if email confirmation is enabled."
        );
      }

      setSuccess(true);
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900">
      <div className="mx-auto max-w-lg">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            BrandBridge
          </Link>
          <span className="text-sm text-slate-500">
            Create your account
          </span>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-700">
            Join the marketplace
          </p>

          <h1 className="text-3xl font-bold">Get started</h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Create an account to connect brands and game developers
            through meaningful in-game partnerships.
          </p>

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <fieldset>
              <legend className="mb-3 text-sm font-semibold">
                I am registering as a
              </legend>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType("brand")}
                  aria-pressed={accountType === "brand"}
                  className={`rounded-xl border px-4 py-4 text-sm font-semibold transition ${
                    accountType === "brand"
                      ? "border-blue-700 bg-blue-50 text-blue-800"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  Brand
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType("developer")}
                  aria-pressed={accountType === "developer"}
                  className={`rounded-xl border px-4 py-4 text-sm font-semibold transition ${
                    accountType === "developer"
                      ? "border-blue-700 bg-blue-50 text-blue-800"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  Game Developer
                </button>
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 12 characters"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Enter your password again"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            {message && (
              <div
                role="status"
                className={`rounded-xl border p-4 text-sm leading-6 ${
                  success
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-5 py-3.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          BrandBridge · Secure account registration powered by Supabase
        </p>
      </div>
    </main>
  );
}
