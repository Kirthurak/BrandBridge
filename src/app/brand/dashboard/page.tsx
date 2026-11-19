"use client";
import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import NotificationBell from "@/app/components/NotificationBell";
type StoredData = Record<string, unknown>;
type SavedMatch = {
  id: string;
  name: string;
  studio: string;
  score: number | null;
  monthlyPlayers: number | null;
  price: number | null;
};
type Proposal = {
  id: string;
  gameId: string;
  gameName: string;
  developer: string;
  brand: string;
  objective: string;
  budget: string;
  placement: string;
  message: string;
  status: "Pending" | "Accepted" | "Declined";
  createdAt: string;
};
type BrandProfile = { id: string; brand_name: string };
type ProposalRow = {
  id: string; game_id: string; subject: string; message: string;
  proposed_budget: number | null; status: string; created_at: string;
  games: { name: string; developers: { studio_name: string } | null } | null;
};
function budgetNumber(value: string): number | null {
  const amounts = [...value.matchAll(/\$?([\d,]+)\s*([kKmM])?/g)];
  if (!amounts.length) return null;
  const match = amounts[0];
  const amount = Number(match[1].replaceAll(",", ""));
  const scale = match[2]?.toLowerCase() === "k" ? 1000 : match[2]?.toLowerCase() === "m" ? 1000000 : 1;
  return Number.isFinite(amount) ? amount * scale : null;
}
function validUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
function readObject(key: string): StoredData {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || localStorage.getItem(key) || "{}");
    return value &&
      typeof value === "object" &&
      !Array.isArray(value)
      ? value
      : {};
  } catch {
    return {};
  }
}
function getText(
  data: StoredData,
  keys: string[],
  fallback = "Not specified"
): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
    if (Array.isArray(value) && value.length) {
      return value.map(String).join(", ");
    }
  }
  return fallback;
}
function readMatches(): SavedMatch[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("brandbridge_saved_matches") || "[]"
    );
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (item) =>
          item !== null &&
          typeof item === "object" &&
          typeof item.name === "string"
      )
      .map((item) => ({
        id: String(item.id ?? item.gameId ?? ""),
        name: String(item.name),
        studio: String(
          item.studio ?? item.developer ?? "Game developer"
        ),
        score:
          typeof item.score === "number" ? item.score : null,
        monthlyPlayers:
          typeof item.monthlyPlayers === "number"
            ? item.monthlyPlayers
            : null,
        price:
          typeof item.price === "number" ? item.price : null,
      }));
  } catch {
    return [];
  }
}
function money(value: number): string {
  return "$" + value.toLocaleString("en-US");
}
export default function BrandDashboard() {
  const [brand, setBrand] = useState<StoredData>({});
  const [campaign, setCampaign] = useState<StoredData>({});
  const [matches, setMatches] = useState<SavedMatch[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selected, setSelected] = useState<SavedMatch | null>(null);
  const [proposalMessage, setProposalMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [proposalError, setProposalError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    setBrand(readObject("brandbridge_brand"));
    setCampaign(readObject("brandbridge_campaign"));
    setMatches(readMatches());
    void loadProposals();
    setLoaded(true);
  }, []);
  async function loadProposals() {
    setRefreshing(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setBrandProfile(null);
        setProposals([]);
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("brands")
        .select("id, brand_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile) {
        setBrandProfile(null);
        setProposals([]);
        setFeedback("No brand profile found for this account. Please complete brand onboarding.");
        return;
      }
      setBrandProfile(profile);
        setFeedback("");
      const { data, error } = await supabase
        .from("proposals")
        .select("id, game_id, subject, message, proposed_budget, status, created_at, games(name, developers(studio_name))")
        .eq("brand_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as ProposalRow[];
      setProposals(rows.map((row) => ({
        id: row.id,
        gameId: row.game_id,
        gameName: row.games?.name ?? "Game listing",
        developer: row.games?.developers?.studio_name ?? "Game developer",
        brand: profile.brand_name,
        objective: row.subject,
        budget: row.proposed_budget === null ? "Not specified" : money(Number(row.proposed_budget)),
        placement: "See proposal message",
        message: row.message,
        status: row.status?.toLowerCase() === "accepted" ? "Accepted" : row.status?.toLowerCase() === "declined" ? "Declined" : "Pending",
        createdAt: row.created_at,
      })));
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Unable to load proposals from Supabase.");
    } finally {
      setRefreshing(false);
    }
  }
  const brandName = brandProfile?.brand_name ?? getText(brand, ["company", "companyName", "brandName", "name"], "Your Brand");
  const objective = getText(
    campaign,
    ["objective", "campaignObjective", "goal"]
  );
  const market = getText(
    campaign,
    ["location", "market", "targetMarket", "region"]
  );
  const budget = getText(
    brand,
    ["budget", "budgetRange"],
    getText(campaign, ["budget", "budgetRange"])
  );
  const genres = getText(
    campaign,
    ["genres", "preferredGenres", "gameGenres"]
  );
  const platforms = getText(
    campaign,
    ["platforms", "preferredPlatforms"]
  );
  const placement = getText(
    campaign,
    ["placement", "placementType", "preferredPlacement"]
  );
  const card: CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 24,
  };
  const primary: CSSProperties = {
    display: "inline-block",
    background: "#111827",
    color: "#ffffff",
    padding: "12px 18px",
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
  };
  const secondary: CSSProperties = {
    ...primary,
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #cbd5e1",
  };
  function removeMatch(id: string) {
    const updated = matches.filter((item) => item.id !== id);
    setMatches(updated);
    localStorage.setItem(
      "brandbridge_saved_matches",
      JSON.stringify(
        updated.map((item) => ({
          ...item,
          id: item.id,
        }))
      )
    );
    setFeedback("Saved match removed.");
  }
  async function sendProposal() {
    if (!selected || sending) return;
    setProposalError("");
    if (!brandProfile) {
      setProposalError("Please sign in with your brand account and complete brand onboarding before sending proposals.");
      return;
    }
    if (brandName === "Your Brand" || objective === "Not specified" || budget === "Not specified" || placement === "Not specified") {
      setProposalError("Complete your brand and campaign information before sending a proposal. Open Edit Campaign and save your campaign goals first.");
      return;
    }
    if (!proposalMessage.trim()) {
      setProposalError("Please enter a message before sending your proposal.");
      return;
    }
    setSending(true);
    try {
      let gameId = selected.id;
      // Old prototype matches sometimes used numeric IDs. Resolve the real
      // Supabase UUID before creating a foreign-key-linked proposal.
      if (!validUuid(gameId)) {

          // Legacy saved matches have local numeric IDs, not Supabase UUIDs.

          // Find candidates by game name first, then use the studio to

          // disambiguate only when multiple real games share that name.

          const { data: candidates, error: lookupError } = await supabase

            .from("games")

            .select("id, name, developers(studio_name)")

            .ilike("name", selected.name.trim());
          if (lookupError) throw lookupError;
          const games = candidates ?? [];

          if (games.length === 0) {

            throw new Error(`No Supabase game listing was found for ${selected.name}.`);

          }
          if (games.length === 1) {

            gameId = games[0].id;

          } else {

            const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

            const matching = games.filter((item) => {

              const developer = item.developers as unknown as { studio_name: string } | null;

              return normalize(developer?.studio_name ?? "") === normalize(selected.studio);

            });

            if (matching.length !== 1) {

              throw new Error(`Multiple listings named ${selected.name} exist. Could not identify the correct developer.`);

            }

            gameId = matching[0].id;

          }

        }
      const { data: existing, error: checkError } = await supabase
        .from("proposals")
        .select("id, status")
        .eq("brand_id", brandProfile.id)
        .eq("game_id", gameId)
        .in("status", ["pending", "accepted"])
        .limit(1);
      if (checkError) throw checkError;
      if (existing?.length) {
        throw new Error("You already have a pending or accepted proposal for this game.");
      }
      const { error } = await supabase.from("proposals").insert({
        brand_id: brandProfile.id,
        game_id: gameId,
        subject: `${objective} — ${placement}`,
        message: proposalMessage.trim(),
        proposed_budget: budgetNumber(budget),
        status: "pending",
      });
      if (error) throw error;
      setSelected(null);
      setProposalMessage("");
      setFeedback(`Proposal sent for ${selected.name} and saved in Supabase.`);
      await loadProposals();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send proposal.";
      setProposalError(message);
      console.error("BrandBridge proposal submission failed:", err);
    } finally {
      setSending(false);
    }
  }
  if (!loaded) {
    return (
      <main
        style={{
          padding: 40,
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading dashboard...
      </main>
    );
  }
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        padding: "36px 24px 80px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <Link
            href="/"
            style={{
              fontWeight: 800,
              color: "#111827",
            }}
          >
            BrandBridge
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <NotificationBell />
            <Link href="/brand/matches" style={primary}>
              Explore Game Matches →
            </Link>
          </div>
        </header>
        <p
          style={{
            color: "#64748b",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          BRAND DASHBOARD
        </p>
        <h1
          style={{
            fontSize: 38,
            margin: "10px 0",
          }}
        >
          Welcome, {brandName}
        </h1>
        <p
          style={{
            color: "#64748b",
            marginBottom: 32,
          }}
        >
          Manage your gaming advertising campaign and
          discover new opportunities.
        </p>
        {feedback && (
          <div
            role="status"
            style={{
              ...card,
              marginBottom: 24,
              borderColor: "#93c5fd",
              color: "#1d4ed8",
            }}
          >
            {feedback}
          </div>
        )}
        {!brandProfile && (
          <p style={{ ...card, marginBottom: 24, color: "#b91c1c" }}>
            Sign in with your BrandBridge brand account to send and view shared proposals. {" "}
            <Link href="/login" style={{ textDecoration: "underline" }}>Sign in</Link>
          </p>
        )}
        <button type="button" disabled={refreshing} onClick={() => void loadProposals()}
          style={{ ...secondary, marginBottom: 24 }}>
          {refreshing ? "Refreshing proposals..." : "Refresh proposals"}
        </button>
        {/* DASHBOARD SUMMARY */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div style={card}>
            <p style={{ color: "#64748b" }}>
              Active campaigns
            </p>
            <h2 style={{ fontSize: 32 }}>
              {Object.keys(campaign).length > 0 ? 1 : 0}
            </h2>
          </div>
          <div style={card}>
            <p style={{ color: "#64748b" }}>
              Saved game matches
            </p>
            <h2 style={{ fontSize: 32 }}>
              {matches.length}
            </h2>
          </div>
          <div style={card}>
            <p style={{ color: "#64748b" }}>
              Campaign budget
            </p>
            <h2 style={{ fontSize: 20 }}>
              {budget}
            </h2>
          </div>
          <div style={card}>
            <p style={{ color: "#64748b" }}>
              Proposals sent
            </p>
            <h2 style={{ fontSize: 32 }}>
              {
                proposals.filter(
                  (proposal) =>
                    proposal.brand === brandProfile?.brand_name
                ).length
              }
            </h2>
          </div>
        </section>
        {/* CAMPAIGN DETAILS */}
        <section
          style={{
            ...card,
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 23,
              marginTop: 0,
            }}
          >
            Your Campaign
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 24,
              marginTop: 24,
            }}
          >
            {[
              ["Campaign objective", objective],
              ["Target market", market],
              ["Preferred genres", genres],
              ["Preferred platforms", platforms],
              ["Preferred placement", placement],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ color: "#64748b" }}>
                  {label}
                </p>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28 }}>
            <Link
              href="/brand/campaign"
              style={primary}
            >
              Edit Campaign
            </Link>
          </div>
        </section>
        {/* SAVED GAME OPPORTUNITIES */}
        <section
          style={{
            ...card,
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 23,
              marginTop: 0,
            }}
          >
            Saved Game Opportunities
          </h2>
          {matches.length === 0 ? (
            <div style={{ padding: "20px 0" }}>
              <p style={{ color: "#64748b" }}>
                You have not saved any game matches yet.
              </p>
              <Link
                href="/brand/matches"
                style={primary}
              >
                Find Game Matches →
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 16,
                marginTop: 20,
              }}
            >
              {matches.map((match) => {
                const existingProposal = proposals
                  .filter(
                    (proposal) =>
                      (proposal.gameId === match.id ||
                         (proposal.gameName === match.name && proposal.developer === match.studio)) &&
                      proposal.brand === brandProfile?.brand_name
                  )
                  .at(-1);
                const proposalStatus =
                  existingProposal?.status;
                const hasActiveProposal =
                  proposalStatus === "Pending" ||
                  proposalStatus === "Accepted";
                return (
                  <div
                    key={match.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    <h3 style={{ marginTop: 0 }}>
                      {match.name}
                    </h3>
                    <p style={{ color: "#64748b" }}>
                      by {match.studio}
                    </p>
                    {match.score !== null && (
                      <p>
                        <strong>
                          {match.score}%
                        </strong>{" "}
                        compatibility
                      </p>
                    )}
                    {match.monthlyPlayers !== null && (
                      <p>
                        {match.monthlyPlayers.toLocaleString(
                          "en-US"
                        )}{" "}
                        reported monthly players
                      </p>
                    )}
                    {match.price !== null && (
                      <p>
                        From {money(match.price)}
                      </p>
                    )}
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        marginTop: 18,
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          ...primary,
                          opacity: hasActiveProposal
                            ? 0.7
                            : 1,
                          cursor: hasActiveProposal
                            ? "not-allowed"
                            : "pointer",
                          background:
                            proposalStatus === "Accepted"
                              ? "#15803d"
                              : "#111827",
                        }}
                        disabled={hasActiveProposal || !brandProfile}
                        onClick={() => {
                                                      if (objective === "Not specified" || budget === "Not specified" || placement === "Not specified") {
                              setFeedback("Your campaign details are missing. Please click Edit Campaign and save the campaign before sending a proposal.");
                              window.scrollTo({ top: 0, behavior: "smooth" });
                              return;
                            }
                            setProposalError("");
                      setSelected(match);
                          setProposalMessage(
                            `Hello ${match.studio},\n\nWe are interested in exploring a ${placement.toLowerCase()} opportunity in ${match.name} for our ${objective.toLowerCase()} campaign. We would welcome the opportunity to discuss availability and next steps.\n\nBest regards,\n${brandName}`
                          );
                          setFeedback("");
                        }}
                      >
                        {proposalStatus === "Accepted"
                          ? "✓ Proposal Accepted"
                          : proposalStatus === "Pending"
                          ? "Proposal Pending"
                          : proposalStatus === "Declined"
                          ? "Send New Proposal"
                          : "Send Proposal"}
                      </button>
                      <button
                        type="button"
                        style={secondary}
                        onClick={() =>
                          removeMatch(match.id)
                        }
                      >
                        Remove Saved Match
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        {/* PROPOSAL HISTORY */}
        <section style={card}>
          <h2
            style={{
              fontSize: 23,
              marginTop: 0,
            }}
          >
            Your Proposals
          </h2>
          {proposals.filter(
            (proposal) =>
              proposal.brand === brandProfile?.brand_name
          ).length === 0 ? (
            <p style={{ color: "#64748b" }}>
              You have not sent any proposals yet.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              {proposals
                .filter(
                  (proposal) =>
                    proposal.brand === brandProfile?.brand_name
                )
                .map((proposal) => (
                  <div
                    key={proposal.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 18,
                    }}
                  >
                    <h3 style={{ marginTop: 0 }}>
                      {proposal.gameName}
                    </h3>
                    <p style={{ color: "#64748b" }}>
                      Developer: {proposal.developer}
                    </p>
                    <p>
                      Status:{" "}
                      <strong
                        style={{
                          color:
                            proposal.status === "Accepted"
                              ? "#15803d"
                              : proposal.status === "Declined"
                              ? "#b91c1c"
                              : "#a16207",
                        }}
                      >
                        {proposal.status}
                      </strong>
                    </p>
                    <p
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                      }}
                    >
                      {proposal.message}
                    </p>
                    {/* NEW PARTNERSHIP WORKSPACE BUTTON */}
                    {proposal.status === "Accepted" && (
                      <div style={{ marginTop: 18 }}>
                        <Link
                          href={`/partnership/${proposal.id}`}
                          style={primary}
                        >
                          Open Partnership Workspace →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </section>
        {/* SEND PROPOSAL MODAL */}
        {selected && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "#0009",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              zIndex: 10,
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Send advertising proposal"
              style={{
                ...card,
                width: "100%",
                maxWidth: 600,
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Send Proposal — {selected.name}
              </h2>
              <p>
                <strong>Brand:</strong>{" "}
                {brandName}
              </p>
              <p>
                <strong>Developer:</strong>{" "}
                {selected.studio}
              </p>
              <p>
                <strong>Objective:</strong>{" "}
                {objective}
              </p>
              <p>
                <strong>Budget:</strong>{" "}
                {budget}
              </p>
              <p>
                <strong>Placement:</strong>{" "}
                {placement}
              </p>
              <label
                htmlFor="proposal-message"
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginTop: 20,
                  marginBottom: 8,
                }}
              >
                Your message
              </label>
              <textarea
                id="proposal-message"
                value={proposalMessage}
                onChange={(event) =>
                  setProposalMessage(
                    event.target.value
                  )
                }
                rows={8}
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  resize: "vertical",
                  color: "#0f172a",
                }}
              />
              {proposalError && (
                <p role="alert" style={{ padding: 14, marginTop: 16, border: "1px solid #fca5a5", background: "#fef2f2", color: "#991b1b", borderRadius: 10, whiteSpace: "pre-wrap" }}>
                  <strong>Proposal not sent:</strong> {proposalError}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 20,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => void sendProposal()}
                  disabled={sending || !brandProfile}
                  style={{ ...primary, opacity: sending || !brandProfile ? 0.6 : 1 }}
                >
                  {sending ? "Sending..." : "Submit Proposal"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelected(null)
                  }
                  style={secondary}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* PROTOTYPE NOTICE */}
        <p
          style={{
            marginTop: 28,
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.7,
          }}
        >
          Prototype notice: Brand profiles are stored in Supabase. Campaign details and
          saved matches are stored in this browser. Advertising proposals
          are stored in Supabase. Game audience figures are
          unverified, and compatibility scores are
          rule-based estimates rather than predictions
          of campaign performance. An accepted proposal
          indicates interest in further discussion,
          not a binding agreement.
        </p>
      </div>
    </main>
  );
}
