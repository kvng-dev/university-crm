// frontend/src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";

// Layout Components
import PublicLayout from "./components/Layout/PublicLayout";

// Pages
import RegisterPage from "./pages/Auth/RegisterPage";
import Layout from "./components/Layout/Layout";
import LoginPage from "./pages/Auth/LoginPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import CoursesPage from "./pages/Courses/CoursesPage";
import CourseDetailPage from "./pages/Courses/CourseDetailPage";
import { CreateCoursePage } from "./pages/Courses/CreateCoursePage";
import { AssignmentsPage } from "./pages/Assignments/AssignmentsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AIAssistantPage } from "./pages/AI/AIAssistantPage";
import { ProfilePage } from "./pages/Profile/ProfilePage";
import { AdminPage } from "./pages/Admin/AdminPage";

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  roles?: string[];
}> = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <PublicLayout>
                        <LoginPage />
                      </PublicLayout>
                    </PublicRoute>
                  }
                />

                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <PublicLayout>
                        <RegisterPage />
                      </PublicLayout>
                    </PublicRoute>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <DashboardPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/courses"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <CoursesPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/courses/:id"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <CourseDetailPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/courses/create"
                  element={
                    <ProtectedRoute roles={["lecturer", "admin"]}>
                      <Layout>
                        <CreateCoursePage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/assignments"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <AssignmentsPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/ai-assistant"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <AIAssistantPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute roles={["admin"]}>
                      <Layout>
                        <AdminPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ProfilePage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* Default Routes */}
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>

              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: "#4ade80",
                      secondary: "#fff",
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: "#ef4444",
                      secondary: "#fff",
                    },
                  },
                }}
              />
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
