// frontend/src/pages/Auth/LoginPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  EyeIcon,
  EyeSlashIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";

interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch {
      // Error is already handled by AuthContext with toast
    } finally {
      setLoading(false);
    }
  };

  const sampleCredentials = [
    {
      role: "Admin",
      email: "admin@university.edu",
      password: "Admin123!",
      color: "bg-red-100 text-red-800",
    },
    {
      role: "Lecturer",
      email: "prof.smith@university.edu",
      password: "Lecturer123!",
      color: "bg-blue-100 text-blue-800",
    },
    {
      role: "Student",
      email: "john.doe@student.university.edu",
      password: "Student123!",
      color: "bg-green-100 text-green-800",
    },
  ];

  const fillCredentials = (email: string, password: string) => {
    setValue("email", email);
    setValue("password", password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
            <AcademicCapIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your University CRM account
          </p>
          <p className="mt-1 text-center text-sm text-gray-500">
            Or{" "}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              create a new account
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
            <span className="text-blue-600 mr-2">🚀</span>
            Demo Credentials - Click to auto-fill:
          </h3>
          <div className="space-y-2">
            {sampleCredentials.map((cred, index) => (
              <button
                key={index}
                type="button"
                onClick={() => fillCredentials(cred.email, cred.password)}
                className="w-full text-left p-2 rounded-md border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cred.color}`}
                    >
                      {cred.role}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {cred.email}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                    {cred.password}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500 text-center">
            Click any credential above to automatically fill the login form
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white shadow-xl rounded-lg border border-gray-200">
          <form
            className="px-8 py-6 space-y-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="rounded-md shadow-sm -space-y-px">
              {/* Email */}
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  type="email"
                  autoComplete="email"
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
                  placeholder="Email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 px-3">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="appearance-none rounded-none relative block w-full px-3 py-3 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 px-3">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...register("rememberMe")}
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <AcademicCapIcon className="h-5 w-5 text-blue-300 group-hover:text-blue-200 transition-colors" />
                    </span>
                    Sign in
                  </>
                )}
              </button>
            </div>

            {/* Register Link */}
            <div className="text-center border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            University CRM - Manage courses, assignments, and academic progress
          </p>
          <div className="mt-2 flex justify-center space-x-4 text-xs text-gray-400">
            <span>• Course Management</span>
            <span>• AI Assistant</span>
            <span>• Real-time Notifications</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
