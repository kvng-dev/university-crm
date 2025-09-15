// frontend/src/pages/Assignments/AssignmentsPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { assignmentService } from "../../services/api";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

export const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await assignmentService.getMyAssignments();
      setAssignments(response.data);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "graded":
        return "text-green-600 bg-green-100";
      case "submitted":
        return "text-blue-600 bg-blue-100";
      case "draft":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "graded":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "submitted":
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-gray-500" />;
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track your assignment progress and submissions
        </p>
      </div>

      {assignments.length > 0 ? (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">
                        {assignment.title}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {assignment.course.title} •{" "}
                      {assignment.course.lecturer.firstName}{" "}
                      {assignment.course.lecturer.lastName}
                    </p>
                    {assignment.description && (
                      <p className="mt-2 text-sm text-gray-700">
                        {assignment.description}
                      </p>
                    )}
                  </div>

                  <div className="ml-4 flex items-center space-x-2">
                    {getStatusIcon(assignment.status)}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        assignment.status
                      )}`}
                    >
                      {assignment.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    {assignment.dueDate && (
                      <span>
                        Due:{" "}
                        {formatDistanceToNow(new Date(assignment.dueDate), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                    {assignment.grade !== null && (
                      <span className="text-green-600 font-medium">
                        Grade: {assignment.grade}/{assignment.maxGrade}
                      </span>
                    )}
                  </div>

                  <div className="text-xs">
                    Submitted:{" "}
                    {formatDistanceToNow(new Date(assignment.submittedAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>

                {assignment.feedback && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-gray-700">
                      <strong>Feedback:</strong> {assignment.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No assignments yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Enroll in courses to see assignments here.
          </p>
          <div className="mt-6">
            <Link
              to="/courses"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
