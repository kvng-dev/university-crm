// frontend/src/pages/Dashboard/DashboardPage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpenIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  courseService,
  enrollmentService,
  assignmentService,
  adminService,
} from "../../services/api";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  courses: number;
  enrollments: number;
  assignments: number;
  notifications: number;
}

interface AdminDashboardStats {
  users: {
    total: number;
    students: number;
    lecturers: number;
    admins: number;
  };
  courses: {
    total: number;
    active: number;
    inactive: number;
  };
  enrollments: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  assignments: {
    total: number;
    pending: number;
    approved: number;
  };
}

interface RecentActivity {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  status?: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [stats, setStats] = useState<DashboardStats>({
    courses: 0,
    enrollments: 0,
    assignments: 0,
    notifications: 0,
  });
  const [adminStats, setAdminStats] = useState<AdminDashboardStats>();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      if (user?.role === "admin") {
        // Admin dashboard
        const dashboardResponse = await adminService.getDashboard();
        const data = dashboardResponse.data;

        setAdminStats(data);

        setRecentActivity(data.recentActivity || []);
      } else if (user?.role === "lecturer") {
        // Lecturer dashboard
        const [coursesResponse, enrollmentsResponse, enrollmentStats] =
          await Promise.all([
            courseService.getMyCourses(),
            enrollmentService.getLecturerEnrollments(),
            enrollmentService.getStatistics(),
          ]);

        console.log(enrollmentsResponse.data.enrollments?.length);

        setStats({
          courses: coursesResponse.data.length,
          enrollments: enrollmentStats.data.total,
          assignments: 0, // Could add assignment stats for lecturers
          notifications: unreadCount,
        });

        // Create activity from recent enrollments
        const recentEnrollments = enrollmentsResponse.data.enrollments.slice(
          0,
          5
        );
        setRecentActivity(
          recentEnrollments.map((enrollment: any) => ({
            id: enrollment.id,
            type: "enrollment",
            message: `${enrollment.student.firstName} ${enrollment.student.lastName} enrolled in ${enrollment.course.title}`,
            timestamp: enrollment.enrolledAt,
            status: enrollment.status,
          }))
        );
      } else {
        // Student dashboard
        const [enrollmentsResponse, assignmentsResponse] = await Promise.all([
          enrollmentService.getMyEnrollments(),
          assignmentService.getMyAssignments(),
        ]);

        const approvedEnrollments = enrollmentsResponse.data.filter(
          (e: any) => e.status === "approved"
        );
        const submittedAssignments = assignmentsResponse.data.filter(
          (a: any) => a.status === "submitted" || a.status === "graded"
        );

        setStats({
          courses: approvedEnrollments.length,
          enrollments: enrollmentsResponse.data.length,
          assignments: submittedAssignments.length,
          notifications: unreadCount,
        });

        // Create activity from recent assignments
        const recentAssignments = assignmentsResponse.data.slice(0, 5);
        setRecentActivity(
          recentAssignments.map((assignment: any) => ({
            id: assignment.id,
            type: "assignment",
            message: `${assignment.title} in ${assignment.course.title}`,
            timestamp: assignment.submittedAt || assignment.createdAt,
            status: assignment.status,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatCards = () => {
    const adminBaseCards = [
      {
        name: "Total Users",
        stat: adminStats?.users.total,
        icon: UsersIcon,
        color: "bg-blue-500",
        href: "/users",
      },
      {
        name: "Total Courses",
        stat: adminStats?.courses.total,
        icon: BookOpenIcon,
        color: "bg-orange-500",
        href: "/courses",
      },
      {
        name: "All Enrollments",
        stat: adminStats?.enrollments.total,
        icon: AcademicCapIcon,
        color: "bg-green-500",
        href: "/enrollments",
      },
      {
        name: "All Assignments",
        stat: adminStats?.assignments.total,
        icon: DocumentTextIcon,
        color: "bg-red-500",
        href: "/enrollments",
      },
    ];
    const baseCards = [
      {
        name: "Total Courses",
        stat: stats.courses,
        icon: BookOpenIcon,
        color: "bg-blue-500",
        href: "/courses",
      },
      {
        name:
          user?.role === "admin"
            ? "All Enrollments"
            : user?.role === "lecturer"
            ? "My Enrollments"
            : "My Courses",
        stat: stats.enrollments,
        icon: AcademicCapIcon,
        color: "bg-green-500",
        href: user?.role === "student" ? "/courses" : "/enrollments",
      },
      {
        name: "Assignments",
        stat: stats.assignments,
        icon: DocumentTextIcon,
        color: "bg-yellow-500",
        href: "/assignments",
      },
      {
        name: "Notifications",
        stat: unreadCount,
        icon: ExclamationTriangleIcon,
        color: "bg-red-500",
        href: "/notifications",
      },
    ];

    if (user?.role === "admin") {
      return adminBaseCards;
    } else if (user?.role === "lecturer") {
      return baseCards.filter((card) => card.name !== "Assignments");
    } else {
      return baseCards;
    }
  };

  const getQuickActions = () => {
    if (user?.role === "admin") {
      return [
        { name: "Manage Users", href: "/admin/users", icon: UserGroupIcon },
        {
          name: "Course Approvals",
          href: "/admin/courses",
          icon: BookOpenIcon,
        },
        { name: "System Logs", href: "/admin/logs", icon: ChartBarIcon },
        {
          name: "Send Announcement",
          href: "/admin/announcements",
          icon: ExclamationTriangleIcon,
        },
      ];
    } else if (user?.role === "lecturer") {
      return [
        { name: "Create Course", href: "/courses/create", icon: BookOpenIcon },
        {
          name: "Pending Enrollments",
          href: "/enrollments/pending",
          icon: UserGroupIcon,
        },
        {
          name: "Grade Assignments",
          href: "/assignments/grade",
          icon: DocumentTextIcon,
        },
        { name: "Course Analytics", href: "/analytics", icon: ChartBarIcon },
      ];
    } else {
      return [
        { name: "Browse Courses", href: "/courses", icon: BookOpenIcon },
        {
          name: "My Assignments",
          href: "/assignments",
          icon: DocumentTextIcon,
        },
        {
          name: "AI Recommendations",
          href: "/ai-assistant",
          icon: ChartBarIcon,
        },
        { name: "Academic Progress", href: "/progress", icon: AcademicCapIcon },
      ];
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "enrollment":
        return <UserGroupIcon className="h-5 w-5 text-blue-500" />;
      case "assignment":
        return <DocumentTextIcon className="h-5 w-5 text-green-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "graded":
        return "text-green-600 bg-green-100";
      case "pending":
      case "submitted":
        return "text-yellow-600 bg-yellow-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's what's happening with your{" "}
          {user?.role === "admin"
            ? "system"
            : user?.role === "lecturer"
            ? "courses"
            : "studies"}{" "}
          today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {getStatCards().map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              <div>
                <div className={`absolute ${item.color} rounded-md p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                  {item.name}
                </p>
              </div>
              <div className="ml-16 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {item.stat}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {getQuickActions().map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.name}
                    to={action.href}
                    className="flex items-center p-3 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <Icon className="h-5 w-5 text-gray-500 mr-3" />
                    {action.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={`${activity.type}-${activity.id}`}
                    className="flex items-start space-x-3"
                  >
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {activity.message}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(activity.timestamp), {
                            addSuffix: true,
                          })}
                        </p>
                        {activity.status && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              activity.status
                            )}`}
                          >
                            {activity.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <ClockIcon className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Notifications
            </h2>
            <Link
              to="/notifications"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              View all
            </Link>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {notifications.slice(0, 3).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg ${
                    notification.read ? "bg-gray-50" : "bg-blue-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
