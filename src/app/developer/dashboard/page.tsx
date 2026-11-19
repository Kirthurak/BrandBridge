
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

type Game = {
  id: string;
  name: string;
  developer: string;
  description: string;
  genres: string[];
  platforms: string[];
  audience: string;
  monthlyPlayers: number;
  placements: string[];
  price: number | null;
  funding: number | null;
};

type Developer = {
  id: string;
  studio: string;
  website: string;
  location: string;
  teamSize: string;
  about: string;
};

type Proposal = {
  id: string;
  gameId: string;
  gameName: string;
  developer: string;
  brand: string;
  subject: string;
  budget: string;
  brandId: string;
  rawStatus: string;
  message: string;
  status: "Pending" | "Accepted" | "Declined";
  createdAt: string;
};

const genreOptions = [
  "Sports",
  "Racing",
  "Action",
  "Adventure",
  "Simulation",
  "Strategy",
  "RPG",
  "Shooter",
];

const platformOptions = [
  "PC",
  "PlayStation",
  "Xbox",
  "Nintendo",
  "Mobile",
  "VR",
];

const placementOptions = [
  "Product Placement",
  "Billboards",
  "Vehicles",
  "Stadium Advertising",
  "Virtual Storefront",
  "Sponsored Event",
  "Interactive Experience",
];

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeStatus(status: string): Proposal["status"] {
  if (status.toLowerCase() === "accepted") return "Accepted";
  if (status.toLowerCase() === "declined") return "Declined";
  return "Pending";
}

export default function DeveloperDashboard() {
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Game | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.user) {
        throw new Error(
          "You are not signed in. Please sign in using your developer account."
        );
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error(
          "Your login session could not be verified. Please sign in again."
        );
      }
      setCurrentUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("developers")
        .select(
          "id, studio_name, website, location, team_size, about"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        throw new Error(
          "No developer profile was found for this account. Please complete developer onboarding."
        );
      }

      const { data: listings, error: gamesError } = await supabase
        .from("games")
        .select(
          "id, name, description, genres, platforms, audience, monthly_players, placements, starting_price, funding_sought"
        )
        .eq("developer_id", profile.id)
        .order("created_at", { ascending: false });

      if (gamesError) throw gamesError;

      setDeveloper({
        id: profile.id,
        studio: profile.studio_name,
        website: profile.website ?? "",
        location: profile.location ?? "",
        teamSize: profile.team_size ?? "",
        about: profile.about ?? "",
      });

      setGames(
        (listings ?? []).map((game) => ({
          id: game.id,
          name: game.name,
          developer: profile.studio_name,
          description: game.description ?? "",
          genres: game.genres ?? [],
          platforms: game.platforms ?? [],
          audience: game.audience ?? "",
          monthlyPlayers: Number(game.monthly_players ?? 0),
          placements: game.placements ?? [],
          price:
            game.starting_price == null
              ? null
              : Number(game.starting_price),
          funding:
            game.funding_sought == null
              ? null
              : Number(game.funding_sought),
        }))
      );

      const gameIds = (listings ?? []).map((game) => game.id);
      if (gameIds.length === 0) {
        setProposals([]);
      } else {
        const { data: rows, error: proposalsError } = await supabase
          .from("proposals")
          .select("id, brand_id, game_id, subject, message, proposed_budget, status, created_at")
          .in("game_id", gameIds)
          .order("created_at", { ascending: false });

        if (proposalsError) throw proposalsError;

        const names = new Map((listings ?? []).map((game) => [game.id, game.name]));
        setProposals((rows ?? []).map((row) => ({
          id: row.id,
          gameId: row.game_id,
          gameName: names.get(row.game_id) ?? "Game",
          developer: profile.studio_name,
          brand: "Brand account",
          brandId: row.brand_id,
          subject: row.subject ?? "Advertising opportunity",
          budget: row.proposed_budget == null ? "Not specified" : money(Number(row.proposed_budget)),
          message: row.message ?? "",
          status: normalizeStatus(String(row.status ?? "pending")),
          rawStatus: String(row.status ?? "pending"),
          createdAt: row.created_at ?? "",
        })));
      }
    } catch (err) {
      setDeveloper(null);
      setGames([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your developer dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const loadNotifications = useCallback(async (userId: string) => {
    const { data, error: fetchError } = await supabase
      .from("notifications")
      .select("id, title, message, link, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (fetchError) {
      setNotificationError(fetchError.message);
      return;
    }
    setNotificationError("");
    setNotifications((data ?? []) as DashboardNotification[]);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    void loadNotifications(currentUserId);

    // Refresh while the dashboard is open, including messages from another account.
    const interval = window.setInterval(() => {
      void loadNotifications(currentUserId);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [currentUserId, loadNotifications]);

  async function markNotificationRead(notificationId: string) {
    if (!currentUserId) return;
    setMarkingId(notificationId);
    const { data, error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", currentUserId)
      .select("id")
      .maybeSingle();

    if (updateError || !data) {
      setNotificationError(updateError?.message ?? "Unable to mark notification as read. Check notification update permissions.");
    } else {
      setNotifications((items) => items.map((item) =>
        item.id === notificationId ? { ...item, is_read: true } : item
      ));
      setNotificationError("");
    }
    setMarkingId(null);
  }

  const unreadNotifications = notifications.filter((item) => !item.is_read).length;

  function startEditing(game: Game) {
    setEditingId(game.id);

    setDraft({
      ...game,
      genres: [...game.genres],
      platforms: [...game.platforms],
      placements: [...game.placements],
    });

    setMessage("");
  }

  function cancelEditing() {
    setEditingId(null);
    setDraft(null);
  }

  function updateDraft<K extends keyof Game>(
    field: K,
    value: Game[K]
  ) {
    setDraft((current) =>
      current ? { ...current, [field]: value } : null
    );
  }

  function toggleOption(
    field: "genres" | "platforms" | "placements",
    value: string
  ) {
    if (!draft) return;

    const updated = draft[field].includes(value)
      ? draft[field].filter((item) => item !== value)
      : [...draft[field], value];

    updateDraft(field, updated);
  }

  async function saveChanges() {
    if (!draft) return;

    setMessage("");

    if (
      !draft.name.trim() ||
      !draft.description.trim() ||
      !draft.audience.trim() ||
      draft.genres.length === 0 ||
      draft.platforms.length === 0 ||
      draft.placements.length === 0 ||
      !Number.isSafeInteger(draft.monthlyPlayers) ||
      draft.monthlyPlayers < 0 ||
      (draft.price !== null &&
        (!Number.isFinite(draft.price) || draft.price < 0)) ||
      (draft.funding !== null &&
        (!Number.isFinite(draft.funding) || draft.funding < 0))
    ) {
      setMessage(
        "Please complete all required fields and enter valid numbers."
      );
      return;
    }

    setSaving(true);

    try {
      const { data, error: updateError } = await supabase
        .from("games")
        .update({
          name: draft.name.trim(),
          description: draft.description.trim(),
          genres: draft.genres,
          platforms: draft.platforms,
          audience: draft.audience.trim(),
          monthly_players: draft.monthlyPlayers,
          placements: draft.placements,
          starting_price: draft.price,
          funding_sought: draft.funding,
        })
        .eq("id", draft.id)
        .select("id")
        .single();

      if (updateError) throw updateError;
      if (!data) throw new Error("The game was not updated.");

      setGames((current) =>
        current.map((game) =>
          game.id === draft.id
            ? {
                ...draft,
                name: draft.name.trim(),
                description: draft.description.trim(),
                audience: draft.audience.trim(),
              }
            : game
        )
      );

      cancelEditing();
      setMessage("Game listing updated successfully in Supabase.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Unable to update game."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteGame(id: string) {
    const game = games.find((item) => item.id === id);
    if (!game) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${game.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");

    try {
      const { data, error: deleteError } = await supabase
        .from("games")
        .delete()
        .eq("id", id)
        .select("id")
        .single();

      if (deleteError) throw deleteError;
      if (!data) throw new Error("The game was not deleted.");

      setGames((current) =>
        current.filter((item) => item.id !== id)
      );

      if (editingId === id) cancelEditing();

      setMessage(`${game.name} was deleted from Supabase.`);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Unable to delete game."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const [updatingProposalId, setUpdatingProposalId] = useState<string | null>(null);

  async function updateProposalStatus(
    proposalId: string,
    status: "Accepted" | "Declined"
  ) {
    const current = proposals.find((proposal) => proposal.id === proposalId);
    if (!current || current.status !== "Pending") return;

    setUpdatingProposalId(proposalId);
    setMessage("");
    try {
      const { data, error: updateError } = await supabase
        .from("proposals")
        .update({ status: status.toLowerCase() })
        .eq("id", proposalId)
        .eq("status", current.rawStatus)
        .select("id, status")
        .maybeSingle();

      if (updateError) throw updateError;
      if (!data) throw new Error("Proposal was already updated or access was denied. Refresh the dashboard.");

      setProposals((existing) => existing.map((proposal) =>
        proposal.id === proposalId
          ? { ...proposal, status: normalizeStatus(data.status), rawStatus: data.status }
          : proposal
      ));
      setMessage(`Proposal ${status.toLowerCase()} successfully in Supabase.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update proposal.");
    } finally {
      setUpdatingProposalId(null);
    }
  }

  const totalPlayers = games.reduce(
    (sum, game) => sum + game.monthlyPlayers,
    0
  );

  const prices = games
    .map((game) => game.price)
    .filter(
      (price): price is number =>
        typeof price === "number" && Number.isFinite(price)
    );

  const lowestPrice = prices.length
    ? Math.min(...prices)
    : null;

  const studioName = developer?.studio ?? "Your Studio";

  const studioGameIds = new Set(
    games.map((game) => game.id)
  );

  const incomingProposals = proposals.filter((proposal) =>
    studioGameIds.has(proposal.gameId)
  );

  const pendingCount = incomingProposals.filter(
    (proposal) => proposal.status === "Pending"
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080b12] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Brand<span className="text-blue-500">Bridge</span>
          </h1>
          <p className="mt-4 text-gray-400">
            Loading your developer dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080b12] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-2xl font-bold">
          Brand<span className="text-blue-500">Bridge</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              aria-label={`Notifications, ${unreadNotifications} unread`}
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-xl hover:border-blue-500"
            >
              🔔
              {unreadNotifications > 0 && (
                <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-blue-600 px-1 text-center text-xs font-bold text-white">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-14 z-50 w-[min(90vw,390px)] rounded-2xl border border-gray-700 bg-[#111827] p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-semibold">Notifications</h2>
                  <button type="button" className="text-sm text-gray-400 hover:text-white" onClick={() => currentUserId && void loadNotifications(currentUserId)}>
                    Refresh
                  </button>
                </div>
                {notificationError && <p role="alert" className="mb-3 text-sm text-red-300">{notificationError}</p>}
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="py-5 text-sm text-gray-400">No notifications yet.</p>
                  ) : notifications.map((notification) => {
                    const safeLink = notification.link?.startsWith("/partnership/") &&
                      !notification.link.startsWith("//") ? notification.link : null;
                    return (
                      <div key={notification.id} className={`rounded-xl border p-3 ${notification.is_read ? "border-gray-800 bg-gray-900/50" : "border-blue-500/40 bg-blue-500/10"}`}>
                        <p className="text-sm font-semibold">{notification.title}</p>
                        <p className="mt-1 text-sm text-gray-300">{notification.message}</p>
                        <p className="mt-2 text-xs text-gray-500">{new Date(notification.created_at).toLocaleString()}</p>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                          {safeLink && <Link href={safeLink} className="text-blue-300 hover:underline">Open partnership</Link>}
                          {!notification.is_read && (
                            <button type="button" disabled={markingId === notification.id} onClick={() => void markNotificationRead(notification.id)} className="text-gray-200 hover:underline disabled:opacity-50">
                              {markingId === notification.id ? "Saving..." : "Mark as read"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <Link
            href="/developer/onboarding"
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Studio onboarding
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        <p className="text-sm font-semibold tracking-widest text-blue-400">
          DEVELOPER DASHBOARD
        </p>

        <div className="mt-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-4xl font-bold">
              {studioName}
            </h1>

            <p className="mt-3 text-gray-400">
              Manage your games and advertising opportunities.
            </p>
          </div>

          <Link
            href="/developer/game"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
          >
            + Add New Game
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <p className="text-sm text-gray-400">Game listings</p>
            <p className="mt-3 text-3xl font-bold">
              {games.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <p className="text-sm text-gray-400">
              Total reported monthly players
            </p>
            <p className="mt-3 text-3xl font-bold">
              {totalPlayers.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <p className="text-sm text-gray-400">
              Lowest starting advertising price
            </p>
            <p className="mt-3 text-3xl font-bold">
              {lowestPrice === null
                ? "Not listed"
                : money(lowestPrice)}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6">
            <p className="text-sm text-blue-200">
              Pending proposals
            </p>
            <p className="mt-3 text-3xl font-bold">
              {pendingCount}
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200"
          >
            <p>{error}</p>

            <div className="mt-4 flex flex-wrap gap-4">
              <Link href="/login" className="underline">
                Sign in
              </Link>

              <Link
                href="/developer/onboarding"
                className="underline"
              >
                Complete onboarding
              </Link>

              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mt-8 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-200"
          >
            {message}
          </div>
        )}

        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-widest text-blue-400">
                BRAND PARTNERSHIPS
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Incoming Advertising Proposals
              </h2>
            </div>

            <span className="rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-300">
              {incomingProposals.length} total
            </span>
          </div>

          {incomingProposals.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-700 p-8">
              <h3 className="text-lg font-semibold">
                No advertising proposals yet
              </h3>

              <p className="mt-3 text-sm leading-7 text-gray-400">
                When a brand sends a proposal for one of your
                listed games, it will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {incomingProposals.map((proposal) => (
                <article
                  key={proposal.id}
                  className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-blue-400">
                        BRAND OPPORTUNITY
                      </p>

                      <h3 className="mt-2 text-2xl font-bold">
                        {proposal.brand}
                      </h3>

                      <p className="mt-2 text-gray-400">
                        Interested in {proposal.gameName}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        proposal.status === "Pending"
                          ? "bg-yellow-500/15 text-yellow-300"
                          : proposal.status === "Accepted"
                          ? "bg-green-500/15 text-green-300"
                          : "bg-red-500/15 text-red-300"
                      }`}
                    >
                      {proposal.status}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-gray-500">
                        Proposal subject
                      </p>
                      <p className="mt-1 font-semibold">
                        {proposal.subject}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Proposed budget
                      </p>
                      <p className="mt-1 font-semibold">
                        {proposal.budget}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Brand account ID
                      </p>
                      <p className="mt-1 font-semibold">
                        {proposal.brandId.slice(0, 8)}…
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-gray-800 bg-[#0d111a] p-5">
                    <h4 className="font-semibold">
                      Message from {proposal.brand}
                    </h4>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-300">
                      {proposal.message}
                    </p>
                  </div>

                  <p className="mt-4 text-xs text-gray-500">
                    Submitted{" "}
                    {Number.isFinite(Date.parse(proposal.createdAt))
                      ? new Date(proposal.createdAt).toLocaleString()
                      : "Date unavailable"}
                  </p>

                  {proposal.status === "Pending" ? (
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={updatingProposalId === proposal.id}
                        onClick={() => void
                          updateProposalStatus(
                            proposal.id,
                            "Accepted"
                          )
                        }
                        className="rounded-xl bg-green-600 px-6 py-3 font-semibold hover:bg-green-500"
                      >
                        Accept Proposal
                      </button>

                      <button
                        type="button"
                        disabled={updatingProposalId === proposal.id}
                        onClick={() => void
                          updateProposalStatus(
                            proposal.id,
                            "Declined"
                          )
                        }
                        className="rounded-xl border border-red-500/40 px-6 py-3 font-semibold text-red-300 hover:bg-red-500/10"
                      >
                        Decline Proposal
                      </button>
                    </div>
                  ) : (
                    <p className="mt-6 text-sm text-gray-400">
                      This proposal has been{" "}
                      {proposal.status.toLowerCase()}.
                    </p>
                  )}

                  {proposal.status === "Accepted" && (
                    <div className="mt-5">
                      <Link
                        href={`/partnership/${proposal.id}`}
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
                      >
                        Open Partnership Workspace →
                      </Link>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-12 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">
            Your Game Listings
          </h2>

          <span className="text-sm text-gray-500">
            {games.length} total
          </span>
        </div>

        {games.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-700 p-10 text-center">
            <h3 className="text-xl font-semibold">
              No games listed yet
            </h3>

            <p className="mt-3 text-gray-400">
              {error
                ? "Sign in successfully to load your existing game listings."
                : "Create your first game advertising opportunity."}
            </p>

            {!error && (
              <Link
                href="/developer/game"
                className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold"
              >
                List a Game
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {games.map((game) => (
              <article
                key={game.id}
                className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row">
                  <div className="max-w-3xl">
                    <h3 className="text-2xl font-bold">
                      {game.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {game.developer}
                    </p>

                    <p className="mt-4 text-gray-400">
                      {game.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {[
                        ...game.genres,
                        ...game.platforms,
                      ].map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-sm md:text-right">
                    <p className="font-semibold">
                      {game.monthlyPlayers.toLocaleString()}{" "}
                      monthly players
                    </p>

                    <p className="text-gray-400">
                      {game.price === null
                        ? "Price on request"
                        : `From ${money(game.price)}`}
                    </p>

                    <p className="text-xs text-gray-500">
                      Supabase listing
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-800 pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      editingId === game.id
                        ? cancelEditing()
                        : startEditing(game)
                    }
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-500"
                  >
                    {editingId === game.id
                      ? "Cancel Editing"
                      : "Edit Game"}
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === game.id}
                    onClick={() => void deleteGame(game.id)}
                    className="rounded-xl border border-red-500/40 px-5 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {deletingId === game.id
                      ? "Deleting..."
                      : "Delete Listing"}
                  </button>
                </div>

                {editingId === game.id && draft && (
                  <div className="mt-7 space-y-5 rounded-2xl border border-gray-700 bg-[#0d111a] p-6">
                    <h4 className="text-xl font-semibold">
                      Edit {game.name}
                    </h4>

                    <label className="block text-sm">
                      Game name
                      <input
                        value={draft.name}
                        onChange={(e) =>
                          updateDraft("name", e.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-900 p-3 text-white"
                      />
                    </label>

                    <label className="block text-sm">
                      Description
                      <textarea
                        rows={4}
                        value={draft.description}
                        onChange={(e) =>
                          updateDraft(
                            "description",
                            e.target.value
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-900 p-3 text-white"
                      />
                    </label>

                    <label className="block text-sm">
                      Player audience
                      <textarea
                        rows={3}
                        value={draft.audience}
                        onChange={(e) =>
                          updateDraft(
                            "audience",
                            e.target.value
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-900 p-3 text-white"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="block text-sm">
                        Monthly players
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={draft.monthlyPlayers}
                          onChange={(e) =>
                            updateDraft(
                              "monthlyPlayers",
                              e.target.value === ""
                                ? NaN
                                : Number(e.target.value)
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-900 p-3 text-white"
                        />
                      </label>

                      <label className="block text-sm">
                        Starting price (USD)
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft.price ?? ""}
                          onChange={(e) =>
                            updateDraft(
                              "price",
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-900 p-3 text-white"
                        />
                      </label>

                      <label className="block text-sm">
                        Funding sought (USD)
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft.funding ?? ""}
                          onChange={(e) =>
                            updateDraft(
                              "funding",
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-900 p-3 text-white"
                        />
                      </label>
                    </div>

                    {(
                      [
                        [
                          "genres",
                          genreOptions,
                          "Game genres",
                        ],
                        [
                          "platforms",
                          platformOptions,
                          "Gaming platforms",
                        ],
                        [
                          "placements",
                          placementOptions,
                          "Advertising placements",
                        ],
                      ] as const
                    ).map(([field, options, label]) => (
                      <div key={field}>
                        <p className="mb-3 text-sm font-semibold">
                          {label}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {options.map((option) => {
                            const selected =
                              draft[field].includes(option);

                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() =>
                                  toggleOption(field, option)
                                }
                                className={`rounded-lg border px-3 py-2 text-sm ${
                                  selected
                                    ? "border-blue-500 bg-blue-600/20 text-blue-200"
                                    : "border-gray-700 text-gray-400"
                                }`}
                              >
                                {selected ? "✓ " : ""}
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void saveChanges()}
                        className="rounded-xl bg-green-600 px-6 py-3 font-semibold hover:bg-green-500 disabled:opacity-50"
                      >
                        {saving
                          ? "Saving..."
                          : "Save Changes"}
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-xl border border-gray-700 px-6 py-3 font-semibold text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-sm leading-6 text-yellow-100/80">
          Game listings and edits are stored in Supabase.
          Advertising proposals and their statuses are stored in Supabase.
          Partnership messages are stored in Supabase and shared between
          the participating accounts.
          Monthly player counts and prices are unverified.
          Accepting a proposal does not create a binding agreement.
        </div>
      </section>
    </main>
  );
}
