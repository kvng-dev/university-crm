// frontend/src/components/Notifications/NotificationDropdown.tsx
import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { useNotifications } from "../../contexts/NotificationContext";
import { formatDistanceToNow } from "date-fns";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
}) => {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadNotifications = notifications.filter((n) => !n.read).slice(0, 5);
  const recentNotifications = notifications.slice(0, 8);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "enrollment_approved":
        return "✅";
      case "enrollment_rejected":
        return "❌";
      case "assignment_graded":
        return "📝";
      case "course_created":
      case "course_updated":
        return "📚";
      case "new_assignment":
        return "📋";
      case "deadline_reminder":
        return "⏰";
      case "system":
        return "🔔";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "enrollment_approved":
        return "text-green-600";
      case "enrollment_rejected":
        return "text-red-600";
      case "assignment_graded":
        return "text-blue-600";
      case "deadline_reminder":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 flex items-center">
          <BellIcon className="h-4 w-4 mr-2" />
          Notifications
        </h3>
        <div className="flex items-center space-x-2">
          {unreadNotifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-500"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">
              Loading notifications...
            </p>
          </div>
        ) : recentNotifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 transition-colors duration-150 ${
                  !notification.read
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <span className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 ml-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Mark as read"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete notification"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center">
            <BellIcon className="h-8 w-8 mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {recentNotifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200">
          <Link
            to="/notifications"
            onClick={onClose}
            className="block text-center text-sm text-blue-600 hover:text-blue-500"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
