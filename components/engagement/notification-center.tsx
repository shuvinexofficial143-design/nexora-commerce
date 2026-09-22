"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { notificationSeed } from "@/lib/account-data";
import { engagementNotifications } from "@/lib/engagement-data";
import { readNotificationIds, saveNotificationIds } from "@/lib/engagement-store";
import type { EngagementNotification } from "@/types/engagement";

const legacyNotifications: EngagementNotification[] = notificationSeed.map((notification) => ({
  id: `legacy-${notification.id}`,
  title: notification.title,
  message: notification.message,
  time: notification.time,
  icon: notification.icon,
  read: notification.read,
  category: "account",
}));

export function NotificationCenter() {
  const base = useMemo(
    () => [...engagementNotifications, ...legacyNotifications],
    [],
  );
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    queueMicrotask(() => setReadIds(readNotificationIds()));
  }, []);

  const items = base.map((item) => ({
    ...item,
    read: item.read || readIds.includes(item.id),
  }));

  const mark = (id: string) => {
    const next = Array.from(new Set([...readIds, id]));
    setReadIds(next);
    saveNotificationIds(next);
  };

  const markAll = () => {
    const next = base.map((notification) => notification.id);
    setReadIds(next);
    saveNotificationIds(next);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-black/35">
            Smart inbox
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Notifications</h1>
        </div>
        <button onClick={markAll} className="text-xs font-black">
          Mark all read
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AccountSidebar />
        <div className="space-y-3">
          {items.map((notification) => {
            const content = (
              <div className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/5 text-lg font-black">
                  {notification.icon}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black">{notification.title}</h3>
                    {!notification.read ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-bold leading-6 text-black/50">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-[11px] font-black uppercase tracking-[.12em] text-black/30">
                    {notification.time}
                  </p>
                </div>
              </div>
            );

            return notification.href ? (
              <Link
                key={notification.id}
                href={notification.href}
                onClick={() => mark(notification.id)}
                className={`block rounded-[24px] border p-5 ${
                  notification.read
                    ? "border-black/8 bg-white"
                    : "border-black/15 bg-[#f4f8df]"
                }`}
              >
                {content}
              </Link>
            ) : (
              <button
                key={notification.id}
                onClick={() => mark(notification.id)}
                className={`w-full rounded-[24px] border p-5 text-left ${
                  notification.read
                    ? "border-black/8 bg-white"
                    : "border-black/15 bg-[#f4f8df]"
                }`}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
