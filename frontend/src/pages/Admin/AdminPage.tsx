// frontend/src/pages/Admin/AdminPage.tsx
import React, { useState, useEffect } from "react";
import {
  UserGroupIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { adminService,  } from "../../services/api";
import toast from "react-hot-toast";

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [pendingEnrollments, setPendingEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchDashboardData();
      fetchPendingEnrollments();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await adminService.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    }
  };

  const fetchPendingEnrollments = async () => {
    try {
      const response = await adminService.getPendingEnrollments();
      setPendingEnrollments(response.data);
    } catch (error) {
      console.error("Failed to fetch pending enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEnrollment = async (enrollmentId: number) => {
    try {
      await adminService.approveEnrollment(enrollmentId, {
        message: "Your enrollment has been approved by the administrator.",
      });
      toast.success("Enrollment approved successfully");
      fetchPendingEnrollments();
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to approve enrollment";
      toast.error(message);
    }
  };

  const handleRejectEnrollment = async (enrollmentId: number) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      await adminService.rejectEnrollment(enrollmentId, { reason });
      toast.success("Enrollment rejected");
      fetchPendingEnrollments();
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to reject enrollment";
      toast.error(message);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600">
          You need admin privileges to access this page.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-5 shadow rounded-lg h-24"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: "Total Users",
      stat: dashboardData?.users?.total || 0,
      icon: UserGroupIcon,
      color: "bg-blue-500",
    },
    {
      name: "Active Courses",
      stat: dashboardData?.courses?.active || 0,
      icon: AcademicCapIcon,
      color: "bg-green-500",
    },
    {
      name: "Pending Enrollments",
      stat: dashboardData?.enrollments?.pending || 0,
      icon: ExclamationTriangleIcon,
      color: "bg-yellow-500",
    },
    {
      name: "Total Assignments",
      stat: dashboardData?.assignments?.total || 0,
      icon: DocumentTextIcon,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage users, courses, and system settings from here.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
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
            </div>
          );
        })}
      </div>

      {/* Pending Enrollments */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Pending Enrollments
          </h2>
        </div>
        <div className="p-6">
          {pendingEnrollments.length > 0 ? (
            <div className="space-y-4">
              {pendingEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {enrollment.student.firstName}{" "}
                      {enrollment.student.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {enrollment.course.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested:{" "}
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveEnrollment(enrollment.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectEnrollment(enrollment.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircleIcon className="mx-auto h-8 w-8 text-green-500" />
              <p className="mt-2 text-sm text-gray-500">
                No pending enrollments
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
