
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link: string | null;
  proposal_id: string | null;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setNotifications([]);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("notifications")
        .select(
          "id, title, message, is_read, created_at, link, proposal_id"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (queryError) throw queryError;

      setNotifications((data ?? []) as Notification[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function markAsRead(id: string) {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to mark notification as read."
      );
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{
          position: "relative",
          padding: "12px 16px",
          background: "#f1f5f9",
          border: "1px solid #cbd5e1",
          borderRadius: 12,
          fontSize: 22,
          cursor: "pointer",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              background: "#2563eb",
              color: "white",
              borderRadius: 999,
              padding: "3px 7px",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 12px)",
            width: "min(380px, 85vw)",
            maxHeight: 460,
            overflowY: "auto",
            padding: 18,
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            boxShadow: "0 12px 32px #0002",
            zIndex: 100,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <strong>Notifications</strong>
            <button
              type="button"
              disabled={loading}
              onClick={() => void loadNotifications()}
              style={{
                border: "none",
                background: "transparent",
                color: "#2563eb",
                cursor: "pointer",
              }}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && (
            <p role="alert" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          )}

          {!loading && notifications.length === 0 && (
            <p style={{ color: "#64748b" }}>
              No notifications yet.
            </p>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            {notifications.map((notification) => {
              const destination =
                notification.link ||
                (notification.proposal_id
                  ? `/partnership/${notification.proposal_id}`
                  : null);

              const safeDestination =
                destination?.startsWith("/") &&
                !destination.startsWith("//")
                  ? destination
                  : null;

              return (
                <div
                  key={notification.id}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid #dbeafe",
                    background: notification.is_read
                      ? "#f8fafc"
                      : "#eff6ff",
                  }}
                >
                  <strong>{notification.title}</strong>

                  <p style={{ lineHeight: 1.5 }}>
                    {notification.message}
                  </p>

                  <small style={{ color: "#64748b" }}>
                    {new Date(
                      notification.created_at
                    ).toLocaleString()}
                  </small>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 14,
                      marginTop: 12,
                    }}
                  >
                    {safeDestination && (
                      <Link
                        href={safeDestination}
                        style={{ color: "#2563eb" }}
                      >
                        Open partnership
                      </Link>
                    )}

                    {!notification.is_read && (
                      <button
                        type="button"
                        onClick={() =>
                          void markAsRead(notification.id)
                        }
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#2563eb",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Mark as read
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
  );
}
