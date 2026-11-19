
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ProposalRow = {
  id: string;
  brand_id: string;
  game_id: string;
  subject: string;
  message: string;
  proposed_budget: number | null;
  status: string;
  created_at: string;
  brands: { brand_name: string } | null;
  games: {
    name: string;
    developers: { studio_name: string } | null;
  } | null;
};

type PartnershipMessage = {
  id: string;
  proposal_id: string;
  sender_user_id: string;
  sender_role: "brand" | "developer";
  message: string;
  created_at: string;
};

type PartnershipNames = {
  brand_name: string | null;
  developer_name: string | null;
};

export default function PartnershipPage() {
  const params = useParams<{ proposalId: string }>();
  const proposalId = params.proposalId;

  const [proposal, setProposal] = useState<ProposalRow | null>(null);
  const [partnershipNames, setPartnershipNames] =
    useState<PartnershipNames | null>(null);

  const [role, setRole] = useState<"brand" | "developer" | null>(
    null
  );
  const [userId, setUserId] = useState<string | null>(null);

  const [messages, setMessages] = useState<PartnershipMessage[]>(
    []
  );
  const [draft, setDraft] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");

  const loadMessages = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("partnership_messages")
      .select(
        "id, proposal_id, sender_user_id, sender_role, message, created_at"
      )
      .eq("proposal_id", proposalId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setMessageError(
        `Unable to load messages: ${fetchError.message}`
      );
      return;
    }

    setMessageError("");
    setMessages((data ?? []) as PartnershipMessage[]);
  }, [proposalId]);

  useEffect(() => {
    let active = true;

    async function loadPartnership() {
      setLoading(true);
      setError("");
      setPartnershipNames(null);

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !authData.user) {
        setError("Please sign in to view this partnership.");
        setLoading(false);
        return;
      }

      const uid = authData.user.id;
      setUserId(uid);

      const { data, error: proposalError } = await supabase
        .from("proposals")
        .select(
          "id, brand_id, game_id, subject, message, proposed_budget, status, created_at, brands(brand_name), games(name, developers(studio_name))"
        )
        .eq("id", proposalId)
        .maybeSingle();

      if (!active) return;

      if (proposalError || !data) {
        setError(
          "Partnership not found or you do not have permission to view it."
        );
        setLoading(false);
        return;
      }

      const item = data as unknown as ProposalRow;

      const [
        { data: brand },
        { data: developer },
      ] = await Promise.all([
        supabase
          .from("brands")
          .select("id")
          .eq("id", item.brand_id)
          .eq("user_id", uid)
          .maybeSingle(),

        supabase
          .from("games")
          .select("id, developers!inner(user_id)")
          .eq("id", item.game_id)
          .eq("developers.user_id", uid)
          .maybeSingle(),
      ]);

      if (!active) return;

      if (!brand && !developer) {
        setError(
          "Only the brand or game developer can access this partnership."
        );
        setLoading(false);
        return;
      }

      setRole(brand ? "brand" : "developer");
      setProposal(item);

      // Fetch the names through the secure Supabase function.
      // The function must accept a UUID parameter named
      // p_proposal_id and return brand_name and developer_name.
      const { data: namesData, error: namesError } =
        await supabase.rpc("get_partnership_names", {
          p_proposal_id: proposalId,
        });

      if (!active) return;

      if (namesError) {
        console.warn(
          "Could not retrieve partnership names:",
          namesError.message
        );
      } else {
        const result = Array.isArray(namesData)
          ? namesData[0]
          : namesData;

        if (result && typeof result === "object") {
          const names = result as Record<string, unknown>;

          setPartnershipNames({
            brand_name:
              typeof names.brand_name === "string"
                ? names.brand_name
                : null,
            developer_name:
              typeof names.developer_name === "string"
                ? names.developer_name
                : null,
          });
        }
      }

      setLoading(false);
    }

    void loadPartnership();

    return () => {
      active = false;
    };
  }, [proposalId]);

  useEffect(() => {
    if (!proposal || proposal.status.toLowerCase() !== "accepted") {
      return;
    }

    void loadMessages();

    const channel = supabase
      .channel(`partnership-${proposalId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "partnership_messages",
          filter: `proposal_id=eq.${proposalId}`,
        },
        () => {
          void loadMessages();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [proposal, proposalId, loadMessages]);

  async function sendMessage() {
    if (
      !proposal ||
      !role ||
      !userId ||
      !draft.trim() ||
      sending ||
      proposal.status.toLowerCase() !== "accepted"
    ) {
      return;
    }

    setSending(true);
    setMessageError("");

    const { error: sendError } = await supabase
      .from("partnership_messages")
      .insert({
        proposal_id: proposal.id,
        sender_user_id: userId,
        sender_role: role,
        message: draft.trim(),
      });

    if (sendError) {
      setMessageError(
        `Message not sent: ${sendError.message}`
      );
    } else {
      setDraft("");
      await loadMessages();
    }

    setSending(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-10 text-slate-900">
        Loading partnership...
      </main>
    );
  }

  if (error || !proposal) {
    return (
      <main className="min-h-screen bg-slate-50 p-10 text-slate-900">
        <h1 className="text-2xl font-bold">
          Partnership unavailable
        </h1>

        <p className="mt-3 text-slate-600">{error}</p>

        <Link
          href="/login"
          className="mt-5 mr-6 inline-block underline"
        >
          Sign in
        </Link>

        <Link
          href="/brand/dashboard"
          className="mt-5 inline-block underline"
        >
          Brand Dashboard
        </Link>
      </main>
    );
  }

  const accepted = proposal.status.toLowerCase() === "accepted";

  const brandName =
    partnershipNames?.brand_name ||
    proposal.brands?.brand_name ||
    "Brand account";

  const developerName =
    partnershipNames?.developer_name ||
    proposal.games?.developers?.studio_name ||
    "Game developer";

  const gameName = proposal.games?.name || "Game listing";

  const budget =
    proposal.proposed_budget == null
      ? "Not specified"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(proposal.proposed_budget);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold">
            BrandBridge
          </Link>

          <div className="flex gap-4 text-sm">
            <Link href="/brand/dashboard" className="underline">
              Brand Dashboard
            </Link>

            <Link href="/developer/dashboard" className="underline">
              Developer Dashboard
            </Link>
          </div>
        </header>

        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Partnership Workspace
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">
            {brandName} × {gameName}
          </h1>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              accepted
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {proposal.status.charAt(0).toUpperCase() +
              proposal.status.slice(1)}
          </span>
        </div>

        <p className="mt-2 text-slate-600">
          Game developer: {developerName}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Signed in as:{" "}
          {role === "brand" ? brandName : developerName}
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-slate-500">
              Campaign objective
            </p>

            <p className="mt-2 font-semibold">
              {proposal.subject || "Not specified"}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-slate-500">
              Proposed budget
            </p>

            <p className="mt-2 font-semibold">{budget}</p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-slate-500">
              Placement details
            </p>

            <p className="mt-2 font-semibold">
              See original proposal
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-xl border bg-white p-6">
          <h2 className="text-xl font-bold">
            Original Proposal
          </h2>

          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">
            {proposal.message}
          </p>
        </section>

        <section className="mt-8 rounded-xl border bg-white p-6">
          <h2 className="text-xl font-bold">
            Partnership Messages
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Discuss campaign requirements, pricing, deliverables
            and next steps.
          </p>

          {!accepted ? (
            <p className="mt-5 rounded-lg bg-amber-50 p-4">
              Messaging becomes available after the developer
              accepts the proposal.
            </p>
          ) : (
            <>
              {messageError && (
                <p
                  role="alert"
                  className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
                >
                  {messageError}
                </p>
              )}

              <div className="mt-6 space-y-4">
                {messages.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 p-5 text-slate-500">
                    No messages yet. Start the conversation below.
                  </p>
                ) : (
                  messages.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <strong>
                          {item.sender_role === "brand"
                            ? brandName
                            : developerName}
                        </strong>

                        <span className="text-xs text-slate-500">
                          {new Date(
                            item.created_at
                          ).toLocaleString()}
                        </span>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-slate-700">
                        {item.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 border-t pt-6">
                <label
                  htmlFor="partnership-message"
                  className="block text-sm font-semibold"
                >
                  Your message (
                  {role === "brand" ? brandName : developerName})
                </label>

                <textarea
                  id="partnership-message"
                  value={draft}
                  onChange={(event) =>
                    setDraft(event.target.value)
                  }
                  rows={5}
                  maxLength={10000}
                  placeholder="Write a message about the partnership..."
                  className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-slate-900"
                />

                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={
                    !draft.trim() ||
                    sending ||
                    !!messageError
                  }
                  className="mt-4 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </div>
            </>
          )}
        </section>

        <p className="mt-8 text-sm leading-6 text-slate-500">
          Prototype notice: Partnership acceptance indicates
          interest in further discussion, not a binding
          advertising agreement. Message history is stored
          in Supabase.
        </p>
      </div>
    </main>
  );
}
