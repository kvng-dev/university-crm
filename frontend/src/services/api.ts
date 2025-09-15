// frontend/src/services/api.ts
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

// Create axios instance for authentication
export const authApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create axios instance for general API calls
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Services
export const courseService = {
  getAll: (page = 1, limit = 10) =>
    api.get(`/courses?page=${page}&limit=${limit}`),
  getById: (id: number) => api.get(`/courses/${id}`),
  getMyCourses: () => api.get("/courses/my-courses"),
  create: (data: any) => api.post("/courses", data),
  update: (id: number, data: any) => api.patch(`/courses/${id}`, data),
  delete: (id: number) => api.delete(`/courses/${id}`),
  enroll: (id: number, data: any) => api.post(`/courses/${id}/enroll`, data),
  drop: (id: number) => api.delete(`/courses/${id}/drop`),
  search: (query: string, page = 1, limit = 10) =>
    api.get(`/courses/search?q=${query}&page=${page}&limit=${limit}`),
};

export const assignmentService = {
  getByCourse: (courseId: number) => api.get(`/assignments/course/${courseId}`),
  getMyAssignments: () => api.get("/assignments/my-assignments"),
  getById: (id: number) => api.get(`/assignments/${id}`),
  create: (data: any) => api.post("/assignments", data),
  submit: (id: number, data: FormData) =>
    api.post(`/assignments/${id}/submit`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  grade: (id: number, data: any) => api.post(`/assignments/${id}/grade`, data),
  update: (id: number, data: any) => api.patch(`/assignments/${id}`, data),
  delete: (id: number) => api.delete(`/assignments/${id}`),
  calculateGrade: (courseId: number, studentId: number) =>
    api.get(`/assignments/course/${courseId}/student/${studentId}/grade`),
};

export const enrollmentService = {
  getMyEnrollments: () => api.get("/enrollments/my-courses"),
  getLecturerEnrollments: (status?: string, page = 1, limit = 10) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    return api.get(`/enrollments/lecturer/my-enrollments?${params}`);
  },
  getPending: () => api.get("/enrollments/lecturer/pending"),
  getPendingByCourse: (courseId: number) =>
    api.get(`/enrollments/course/${courseId}/pending`),
  approve: (id: number, data: any) =>
    api.post(`/enrollments/${id}/approve`, data),
  reject: (id: number, data: any) =>
    api.post(`/enrollments/${id}/reject`, data),
  bulkApprove: (data: any) => api.post("/enrollments/bulk-approve", data),
  withdraw: (id: number) => api.delete(`/enrollments/${id}/withdraw`),
  getStatistics: () => api.get("/enrollments/statistics"),
};

export const aiService = {
  recommend: (data: any) => api.post("/ai/recommend", data),
  generateSyllabus: (data: any) => api.post("/ai/syllabus", data),
};

export const notificationService = {
  getAll: (page = 1, limit = 20, unreadOnly = false) =>
    api.get(
      `/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`
    ),
  getById: (id: number) => api.get(`/notifications/${id}`),
  markAsRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/mark-all-read"),
  delete: (id: number) => api.delete(`/notifications/${id}`),
  clearRead: () => api.delete("/notifications/clear-read"),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  getStats: () => api.get("/notifications/stats"),
};

export const adminService = {
  getDashboard: () => api.get("/admin/dashboard"),
  getPendingEnrollments: () => api.get("/admin/enrollments/pending"),
  approveEnrollment: (id: number, data: any) =>
    api.post(`/admin/enrollments/${id}/approve`, data),
  rejectEnrollment: (id: number, data: any) =>
    api.post(`/admin/enrollments/${id}/reject`, data),
  updateUserRole: (id: number, data: any) =>
    api.patch(`/admin/users/${id}/role`, data),
  toggleUserStatus: (id: number) =>
    api.patch(`/admin/users/${id}/toggle-status`),
  getLogs: (page = 1, limit = 50) =>
    api.get(`/admin/logs?page=${page}&limit=${limit}`),
  createAnnouncement: (data: any) => api.post("/admin/announcements", data),
};

export const userService = {
  getAll: (page = 1, limit = 10) =>
    api.get(`/users?page=${page}&limit=${limit}`),
  getById: (id: number) => api.get(`/users/${id}`),
  getByRole: (role: string) => api.get(`/users/role/${role}`),
  search: (query: string, page = 1, limit = 10) =>
    api.get(`/users/search?q=${query}&page=${page}&limit=${limit}`),
  getStats: () => api.get("/users/stats"),
  create: (data: any) => api.post("/users", data),
  update: (id: number, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

export const fileService = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  download: (filename: string) =>
    api.get(`/files/${filename}`, {
      responseType: "blob",
    }),
  getInfo: (filename: string) => api.get(`/files/${filename}/info`),
  extractText: (filename: string) => api.get(`/files/${filename}/text`),
  delete: (filename: string) => api.delete(`/files/${filename}`),
};
