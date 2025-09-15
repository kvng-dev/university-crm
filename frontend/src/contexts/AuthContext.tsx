// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authApi } from "../services/api";
import toast from "react-hot-toast";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "student" | "lecturer" | "admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "student" | "lecturer" | "admin";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (token) {
        try {
          // Set token in axios defaults
          authApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // Get user profile
          const response = await authApi.get("/auth/profile");
          setUser({
            ...response.data,
            fullName: `${response.data.firstName} ${response.data.lastName}`,
          });
        } catch (error) {
          // Token might be expired, try to refresh
          await tryRefreshToken();
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Set up axios interceptor for automatic token refresh
  useEffect(() => {
    const interceptor = authApi.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshSuccessful = await tryRefreshToken();
          if (refreshSuccessful) {
            return authApi(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      authApi.interceptors.response.eject(interceptor);
    };
  }, []);

  const tryRefreshToken = async (): Promise<boolean> => {
    try {
      const response = await authApi.post("/auth/refresh");
      const { user: userData, accessToken } = response.data;

      localStorage.setItem("accessToken", accessToken);
      authApi.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${accessToken}`;
      setUser({
        ...userData,
        fullName: `${userData.firstName} ${userData.lastName}`,
      });
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await authApi.post("/auth/login", { email, password });
      const { user: userData, accessToken } = response.data;

      localStorage.setItem("accessToken", accessToken);
      authApi.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${accessToken}`;
      setUser({
        ...userData,
        fullName: `${userData.firstName} ${userData.lastName}`,
      });

      toast.success(`Welcome back, ${userData.firstName}!`);
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setLoading(true);
      const response = await authApi.post("/auth/register", userData);
      const { user: newUser, accessToken } = response.data;

      localStorage.setItem("accessToken", accessToken);
      authApi.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${accessToken}`;
      setUser({
        ...newUser,
        fullName: `${newUser.firstName} ${newUser.lastName}`,
      });

      toast.success(`Welcome to University CRM, ${newUser.firstName}!`);
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    localStorage.removeItem("accessToken");
    delete authApi.defaults.headers.common["Authorization"];
    setUser(null);

    // Call logout endpoint to clear refresh token cookie
    authApi.post("/auth/logout").catch(() => {
      // Ignore errors on logout endpoint
    });

    toast.success("Logged out successfully");
  };

  const refreshToken = async (): Promise<void> => {
    await tryRefreshToken();
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    try {
      if (!user) throw new Error("No user logged in");

      const response = await authApi.patch(`/users/${user.id}`, data);
      const updatedUser = {
        ...response.data,
        fullName: `${response.data.firstName} ${response.data.lastName}`,
      };

      setUser(updatedUser);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to update profile";
      toast.error(message);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
