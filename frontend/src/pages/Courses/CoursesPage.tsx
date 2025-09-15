// frontend/src/pages/Courses/CoursesPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { courseService } from "../../services/api";
import toast from "react-hot-toast";

interface Course {
  id: number;
  title: string;
  description: string;
  credits: number;
  lecturer: {
    id: number;
    firstName: string;
    lastName: string;
  };
  maxStudents?: number;
  fee?: number;
  semester?: string;
  year?: number;
  enrollments?: {
    id: number;
    status: string;
    finalGrade: null | number;
    enrollmentReason: string;
    rejectionReason: string;
    enrolledAt: string; // ISO date string
    updatedAt: string;
    completedAt: string | null;
    courseId: number;
    studentId: number;
  }[];
}

const CoursesPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [enrollingCourses, setEnrollingCourses] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    fetchCourses();
  }, [currentPage, searchQuery]);

  console.log(courses);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = searchQuery
        ? await courseService.search(searchQuery, currentPage, 12)
        : await courseService.getAll(currentPage, 12);

      setCourses(response.data.courses);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleEnroll = async (courseId: number) => {
    if (!user || user.role !== "student") return;

    try {
      setEnrollingCourses((prev) => new Set([...prev, courseId]));
      await courseService.enroll(courseId, {
        reason:
          "I am interested in this course and believe it will help me achieve my academic goals.",
      });
      toast.success("Enrollment request submitted successfully!");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to enroll in course";
      toast.error(message);
    } finally {
      setEnrollingCourses((prev) => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    }
  };

  const CourseCard: React.FC<{ course: Course }> = ({ course }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              <Link
                to={`/courses/${course.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {course.title}
              </Link>
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {course.description}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <AcademicCapIcon className="h-4 w-4 mr-2" />
            <span>
              {course.lecturer.firstName} {course.lecturer.lastName}
            </span>
          </div>
          {course.semester && course.year && (
            <div className="mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-950">
                {course.semester}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4 text-sm">
          <div className="flex items-center text-gray-500">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>{course.credits} Credits</span>
          </div>

          {course.maxStudents && (
            <div className="flex items-center text-gray-500">
              <UserGroupIcon className="h-4 w-4 mr-1" />
              <span>
                {course.enrollments?.length || 0}/{course.maxStudents}
              </span>
            </div>
          )}

          {course.fee && (
            <div className="flex items-center text-gray-500">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              <span>${course.fee}</span>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <Link
            to={`/courses/${course.id}`}
            className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>

          {user?.role === "student" && !enrollingCourses.has(course.id) && (
            <button
              onClick={() => handleEnroll(course.id)}
              disabled={enrollingCourses.has(course.id)}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enrollingCourses.has(course.id) ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enrolling...
                </div>
              ) : (
                "Enroll"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
            <p className="mt-1 text-sm text-gray-600">
              {user?.role === "student"
                ? "Discover and enroll in courses to advance your education"
                : user?.role === "lecturer"
                ? "Manage your courses and create new ones"
                : "Oversee all courses in the system"}
            </p>
          </div>

          {user?.role === "lecturer" && (
            <div className="mt-4 sm:mt-0">
              <Link
                to="/courses/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Course
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading courses...</span>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && (
        <>
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No courses found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery
                  ? `No courses match "${searchQuery}". Try a different search term.`
                  : "No courses are available at the moment."}
              </p>
              {user?.role === "lecturer" && !searchQuery && (
                <div className="mt-6">
                  <Link
                    to="/courses/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>

              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page{" "}
                    <span className="font-medium">{currentPage}</span> of{" "}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum =
                        Math.max(1, Math.min(currentPage - 2, totalPages - 4)) +
                        i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === currentPage
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CoursesPage;
