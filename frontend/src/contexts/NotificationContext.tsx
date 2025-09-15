// frontend/src/contexts/NotificationContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { notificationService } from "../services/api";
import toast from "react-hot-toast";

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  socket: Socket | null;
  fetchNotifications: (page?: number, unreadOnly?: boolean) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const auth = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const user = auth.user;

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("accessToken");
    if (token) {
      const newSocket = io(
        `${
          import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
          "http://localhost:3001"
        }/notifications`,
        {
          auth: { token },
          withCredentials: true,
        }
      );

      newSocket.on("connect", () => {
        console.log("Connected to notification service");
      });

      newSocket.on("new_notification", (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show toast notification
        toast.success(notification.title, {
          duration: 4000,
        });
      });

      newSocket.on("notification_read", (data: { notificationId: number }) => {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === data.notificationId
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      });

      newSocket.on("all_notifications_read", () => {
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            read: true,
            readAt: new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
      });

      newSocket.on(
        "notification_deleted",
        (data: { notificationId: number }) => {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== data.notificationId)
          );
          // Update unread count if deleted notification was unread
          setNotifications((prev) => {
            const deletedNotification = prev.find(
              (n) => n.id === data.notificationId
            );
            if (deletedNotification && !deletedNotification.read) {
              setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
            }
            return prev.filter((n) => n.id !== data.notificationId);
          });
        }
      );

      newSocket.on("read_notifications_cleared", () => {
        setNotifications((prev) => prev.filter((n) => !n.read));
      });

      newSocket.on("system_announcement", (announcement: any) => {
        toast(announcement.message, {
          icon: "📢",
          duration: 6000,
        });
      });

      newSocket.on("enrollment_update", (data: any) => {
        toast.success(`Enrollment ${data.status}`, {
          duration: 4000,
        });
      });

      newSocket.on("grade_update", (data: any) => {
        toast.success(`Assignment graded: ${data.grade}%`, {
          duration: 4000,
        });
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from notification service");
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  // Fetch initial notifications and unread count
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    fetchUnreadCount();
  }, [user]);

  // ✅ Wait until auth context is done loading before continuing
  if (auth.loading) {
    return null; // or return a loader, fallback UI, etc.
  }

  const fetchNotifications = async (
    page: number = 1,
    unreadOnly: boolean = false
  ) => {
    try {
      setLoading(true);
      const response = await notificationService.getAll(page, 20, unreadOnly);

      if (page === 1) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications((prev) => [...prev, ...response.data.notifications]);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await notificationService.delete(id);
      const notification = notifications.find((n) => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const clearReadNotifications = async () => {
    try {
      await notificationService.clearRead();
      setNotifications((prev) => prev.filter((n) => !n.read));
      toast.success("Read notifications cleared");
    } catch (error) {
      console.error("Failed to clear read notifications:", error);
      toast.error("Failed to clear read notifications");
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    socket,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
