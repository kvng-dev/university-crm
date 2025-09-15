// frontend/src/pages/Courses/CourseDetailPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { courseService } from "../../services/api";
import toast from "react-hot-toast";

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
    }
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      const response = await courseService.getById(Number(id));
      setCourse(response.data);
    } catch (error) {
      console.error("Failed to fetch course details:", error);
      toast.error("Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;

    try {
      setEnrolling(true);
      await courseService.enroll(course.id, {
        reason:
          "I am interested in this course and believe it will help me achieve my academic goals.",
      });
      toast.success("Enrollment request submitted successfully!");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to enroll in course";
      toast.error(message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
        <Link to="/courses" className="text-blue-600 hover:text-blue-500">
          Back to courses
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {course.title}
              </h1>
              <div className="flex items-center text-gray-600 mb-4">
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                <span>
                  {course.lecturer.firstName} {course.lecturer.lastName}
                </span>
              </div>
            </div>

            {user?.role === "student" && (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {enrolling ? "Enrolling..." : "Enroll Now"}
              </button>
            )}
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">
            {course.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <ClockIcon className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Credits</p>
                <p className="font-semibold">{course.credits}</p>
              </div>
            </div>

            {course.maxStudents && (
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <UserGroupIcon className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="font-semibold">
                    {course.enrolledStudentsCount || 0}/{course.maxStudents}
                  </p>
                </div>
              </div>
            )}

            {course.fee && (
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Fee</p>
                  <p className="font-semibold">${course.fee}</p>
                </div>
              </div>
            )}

            {course.semester && (
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Semester</p>
                  <p className="font-semibold">
                    {course.semester} {course.year}
                  </p>
                </div>
              </div>
            )}
          </div>

          {course.syllabusUrl && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Course Materials
              </h3>
              <a
                href={course.syllabusUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-500"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Download Syllabus
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
