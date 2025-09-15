// frontend/src/pages/Courses/CreateCoursePage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import { courseService } from "../../services/api";
import toast from "react-hot-toast";

interface CourseForm {
  title: string;
  description: string;
  credits: number;
  maxStudents?: number;
  fee?: number;
  semester?: string;
  year?: number;
}

export const CreateCoursePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseForm>();

  const onSubmit = async (data: CourseForm) => {
    if (user?.role !== "lecturer" && user?.role !== "admin") {
      toast.error("Only lecturers can create courses");
      return;
    }

    try {
      setLoading(true);
      await courseService.create(data);
      toast.success("Course created successfully!");
      navigate("/courses");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to create course";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Course
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Title *
            </label>
            <input
              {...register("title", { required: "Course title is required" })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Introduction to Computer Science"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              {...register("description", {
                required: "Course description is required",
              })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the course content and learning objectives"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credits *
              </label>
              <input
                {...register("credits", {
                  required: "Credits is required",
                  min: { value: 1, message: "Credits must be at least 1" },
                  max: { value: 6, message: "Credits cannot exceed 6" },
                })}
                type="number"
                min="1"
                max="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.credits && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.credits.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Students
              </label>
              <input
                {...register("maxStudents", {
                  min: { value: 1, message: "Must be at least 1" },
                })}
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
              {errors.maxStudents && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.maxStudents.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <select
                {...register("semester")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select semester</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
                <option value="Winter">Winter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                {...register("year", {
                  min: { value: 2020, message: "Year must be 2020 or later" },
                  max: { value: 2030, message: "Year cannot exceed 2030" },
                })}
                type="number"
                min="2020"
                max="2030"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2024"
              />
              {errors.year && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.year.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Fee ($)
            </label>
            <input
              {...register("fee", {
                min: { value: 0, message: "Fee cannot be negative" },
              })}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
            {errors.fee && (
              <p className="mt-1 text-sm text-red-600">{errors.fee.message}</p>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Course"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/courses")}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
