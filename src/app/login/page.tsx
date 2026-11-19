
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        setMessage(error.message);
        return;
      }

      const accountType = data.user.user_metadata?.account_type;

      if (accountType === "brand") {
        router.push("/brand/dashboard");
      } else if (accountType === "developer") {
        router.push("/developer/dashboard");
      } else {
        setMessage(
          "Signed in, but your account type could not be identified."
        );
      }
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
          <span className="text-sm text-slate-500">Welcome back</span>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-700">
            Account access
          </p>

          <h1 className="text-3xl font-bold">Sign in</h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sign in to your BrandBridge account to continue building
            meaningful partnerships.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            {message && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-5 py-3.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-blue-700 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          BrandBridge · Secure sign-in powered by Supabase
        </p>
      </div>
    </main>
  );
}
