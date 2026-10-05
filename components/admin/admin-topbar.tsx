"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  createdAt: string;
  readAt: string | null;
};

type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function AdminTopbar() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const date = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const unread = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications],
  );

  async function loadNotifications() {
    setNotificationsLoading(true);
    setNotificationsError("");

    try {
      const response = await fetch("/api/admin-app/notifications", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => null)) as
        | Envelope<AdminNotification[]>
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload && !payload.ok
            ? payload.error
            : "Could not load notifications.",
        );
      }

      setNotifications(payload.data);
    } catch (caught) {
      setNotificationsError(
        caught instanceof Error
          ? caught.message
          : "Could not load notifications.",
      );
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function markRead(id: string) {
    try {
      const response = await fetch("/api/admin-app/notifications", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) return;

      setNotifications((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
            : item,
        ),
      );
    } catch {
      // Marking an alert read is non-critical; the next refresh can retry.
    }
  }

  async function toggleNotifications() {
    const next = !notificationsOpen;
    setNotificationsOpen(next);
    if (next) await loadNotifications();
  }

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/admin-app/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  useEffect(() => {
    let active = true;

    fetch("/api/admin-app/notifications", {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | Envelope<AdminNotification[]>
          | null;

        if (active && response.ok && payload?.ok) {
          setNotifications(payload.data);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f5f5f1]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3">
        <div className="hidden flex-1 sm:block">
          <p className="text-xs font-black uppercase tracking-[.15em] text-black/40">
            {date}
          </p>
          <p className="text-sm font-bold">Private store control panel</p>
        </div>

        <div className="flex-1 sm:hidden">
          <p className="text-sm font-black">Owner Admin</p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => void toggleNotifications()}
            aria-label="Admin notifications"
            aria-expanded={notificationsOpen}
            className="relative grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white text-lg transition hover:bg-black hover:text-white"
          >
            ♢
            {unread > 0 ? (
              <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#d7ff47] px-1 text-[9px] font-black text-black">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </button>

          {notificationsOpen ? (
            <div className="absolute right-0 top-14 z-50 w-[min(92vw,390px)] overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/8 px-4 py-3.5">
                <div>
                  <p className="text-sm font-black">Store alerts</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-black/35">
                    {unread} unread
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadNotifications()}
                  disabled={notificationsLoading}
                  className="rounded-full bg-black/5 px-3 py-1.5 text-[10px] font-black disabled:opacity-50"
                >
                  {notificationsLoading ? "Refreshing…" : "Refresh"}
                </button>
              </div>

              {notificationsError ? (
                <p className="m-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
                  {notificationsError}
                </p>
              ) : null}

              <div className="max-h-[430px] overflow-y-auto p-2">
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void markRead(item.id)}
                    className={`mb-1 w-full rounded-2xl p-3 text-left transition hover:bg-black/5 ${
                      item.readAt ? "opacity-60" : "bg-[#f7f7f3]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs font-medium leading-5 text-black/55">
                          {item.message}
                        </p>
                      </div>
                      {!item.readAt ? (
                        <span
                          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                            item.severity === "CRITICAL"
                              ? "bg-red-500"
                              : item.severity === "WARNING"
                                ? "bg-amber-500"
                                : item.severity === "SUCCESS"
                                  ? "bg-emerald-500"
                                  : "bg-black"
                          }`}
                        />
                      ) : null}
                    </div>
                    <p className="mt-2 text-[10px] font-bold text-black/30">
                      {new Date(item.createdAt).toLocaleString("en-IN")}
                    </p>
                  </button>
                ))}

                {!notificationsLoading && !notifications.length ? (
                  <p className="px-4 py-10 text-center text-xs font-bold text-black/35">
                    No store alerts right now.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          disabled={busy}
          className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-black transition hover:bg-black hover:text-white disabled:opacity-50"
        >
          {busy ? "Signing out…" : "Sign out"}
        </button>

        <div className="grid h-11 w-11 place-items-center rounded-full bg-black text-xs font-black text-white">
          OW
        </div>
      </div>
    </header>
  );
}
