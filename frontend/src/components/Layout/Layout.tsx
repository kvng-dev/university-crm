// frontend/src/components/Layout/Layout.tsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  CpuChipIcon,
  UserIcon,
  Cog6ToothIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import NotificationDropdown from "../Notifications/NotificationDropdown";
// import NotificationDropdown from "../Notifications/NotificationDropdown";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
      roles: ["student", "lecturer", "admin"],
    },
    {
      name: "Courses",
      href: "/courses",
      icon: BookOpenIcon,
      roles: ["student", "lecturer", "admin"],
    },
    {
      name: "Assignments",
      href: "/assignments",
      icon: DocumentTextIcon,
      roles: ["student", "lecturer"],
    },
    {
      name: "AI Assistant",
      href: "/ai-assistant",
      icon: CpuChipIcon,
      roles: ["student", "lecturer"],
    },
    {
      name: "Admin Panel",
      href: "/admin",
      icon: Cog6ToothIcon,
      roles: ["admin"],
    },
  ];

  const filteredNavigation = navigation.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 flex z-40 lg:hidden ${
          sidebarOpen ? "" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-shrink-0 flex items-center px-4">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-lg font-bold text-gray-900">
              University CRM
            </span>
          </div>
          <nav className="mt-5 flex-shrink-0 h-full divide-y divide-gray-200 overflow-y-auto">
            <div className="px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } group border-l-4 px-3 py-2 flex items-center text-sm font-medium`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon
                      className={`${
                        isActive
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      } flex-shrink-0 -ml-1 mr-3 h-6 w-6`}
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-blue-600">
            <AcademicCapIcon className="h-8 w-8 text-white" />
            <span className="ml-2 text-lg font-bold text-white">
              University CRM
            </span>
          </div>
          <nav className="mt-5 flex-grow flex flex-col divide-y divide-gray-200 overflow-y-auto">
            <div className="px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } group border-l-4 px-3 py-2 flex items-center text-sm font-medium`}
                  >
                    <Icon
                      className={`${
                        isActive
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      } flex-shrink-0 -ml-1 mr-3 h-6 w-6`}
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  {/* Search can be added here later */}
                </div>
              </div>
            </div>

            <div className="ml-4 flex items-center md:ml-6">
              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                >
                  <BellIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationDropdown
                  isOpen={notificationOpen}
                  onClose={() => setNotificationOpen(false)}
                />
              </div>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </span>
                    </div>
                    <span className="ml-3 text-gray-700 text-sm font-medium lg:block">
                      {user?.fullName}
                    </span>
                    <ChevronDownIcon className="ml-1 h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b">
                      {user?.email}
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserIcon className="inline h-4 w-4 mr-2" />
                      Your Profile
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
