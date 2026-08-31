"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";
import { formatDistanceToNow } from "date-fns";

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: Date;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
};

function hrefFor(n: NotificationItem) {
  if (n.relatedEntityType === "Job" && n.relatedEntityId) return `/jobs/${n.relatedEntityId}`;
  return null;
}

export function NotificationBell({ notifications }: { notifications: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-[#5B6B82] hover:bg-[#FAF7F1]"
      >
        <Bell size={18} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D9480F] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-[#E3DDD0] bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-[#EFEAE0] px-3 py-2">
              <p className="text-sm font-semibold text-[#16233A]">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead()}
                  className="text-xs font-medium text-[#D9480F] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-[#8A93A3]">Nothing yet.</p>
              ) : (
                notifications.map((n) => {
                  const href = hrefFor(n);
                  const content = (
                    <div
                      className={`border-b border-[#EFEAE0] px-3 py-2.5 text-sm last:border-b-0 ${
                        n.isRead ? "" : "bg-[#FBE7DB]/40"
                      }`}
                    >
                      <p className="font-medium text-[#16233A]">{n.title}</p>
                      {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-[#5B6B82]">{n.body}</p>}
                      <p className="mt-1 text-[11px] text-[#8A93A3]">
                        {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  );
                  return href ? (
                    <Link
                      key={n.id}
                      href={href}
                      onClick={() => {
                        if (!n.isRead) markNotificationRead(n.id);
                        setOpen(false);
                      }}
                      className="block hover:bg-[#FAF7F1]"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id}>{content}</div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
