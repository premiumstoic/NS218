"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "@/lib/date-utils";
import "./notification-bell.css";

type Notification = {
  id: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) return;

      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true })
      });

      if (!response.ok) return;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  async function deleteNotification(id: string) {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) return;

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  }

  function navigateToNotification(link: string | null) {
    if (link) {
      window.location.href = link;
      setIsOpen(false);
    }
  }

  if (isLoading) {
    return <div className="notification-bell-placeholder" />;
  }

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        title={`${unreadCount} unread notifications`}
      >
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <span className="notification-count">{unreadCount} new</span>
            )}
          </div>

          <div className="notification-list">
            {error && <p className="notification-error">{error}</p>}

            {notifications.length === 0 ? (
              <p className="notification-empty">No notifications yet</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.is_read ? "read" : "unread"}`}
                >
                  <div
                    className="notification-content"
                    onClick={() => {
                      if (notif.link) {
                        navigateToNotification(notif.link);
                      }
                    }}
                    style={{
                      cursor: notif.link ? "pointer" : "default"
                    }}
                  >
                    <p className={notif.link ? "notification-link" : ""}>{notif.message}</p>
                    <span className="notification-time">
                      {formatDistanceToNow(new Date(notif.created_at))} ago
                    </span>
                  </div>

                  <div className="notification-actions">
                    {!notif.is_read && (
                      <button
                        className="notification-action-btn"
                        onClick={() => markAsRead(notif.id)}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="notification-action-btn delete"
                      onClick={() => deleteNotification(notif.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <button
              className="notification-footer-btn"
              onClick={() =>
                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, is_read: true }))
                )
              }
            >
              Mark all as read
            </button>
          )}
        </div>
      )}
    </div>
  );
}
