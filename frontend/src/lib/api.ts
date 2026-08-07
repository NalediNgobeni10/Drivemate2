import axios from 'axios';
import type {
  User,
  AvailabilitySlot,
  Booking,
  Payment,
  Message,
  Feedback,
  Notification,
  QuizAttempt,
  QuizQuestion,
  StudentProgress,
  MessageThread,
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/login', { email, password }),
  register: (email: string, name: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/register', { email, name, password }),
  me: () => api.get<User>('/auth/me'),
};

// User management (Admin)
export const usersAPI = {
  list: (page = 1, limit = 20) =>
    api.get<{ users: User[]; pagination: any }>('/admin/users', { params: { page, limit } }),
  updateRole: (userId: string, role: string) =>
    api.patch<User>(`/admin/users/${userId}`, { role }),
  delete: (userId: string) => api.delete(`/admin/users/${userId}`),
};

// Availability Slots (Instructor)
export const slotsAPI = {
  create: (data: { date: string; timeWindow: string; vehicle: string; vehicleId?: string }) =>
    api.post<AvailabilitySlot>('/slots', data),
  getAvailable: (date?: string, licenseCode?: string) =>
    api.get<AvailabilitySlot[]>('/slots/available', { params: { date, licenseCode } }),
  getMySchedule: () => api.get<AvailabilitySlot[]>('/slots/my-schedule'),
  delete: (slotId: string) => api.delete(`/slots/${slotId}`),
};

// Bookings (Student)
export const bookingsAPI = {
  book: (slotId: string) => api.post<Booking>(`/bookings/${slotId}`),
  getMyLessons: () => api.get<Booking[]>('/bookings/my-lessons'),
  cancel: (bookingId: string) => api.post(`/bookings/${bookingId}/cancel`),
};

// Progress & History
export const progressAPI = {
  get: (studentId: string) => api.get<StudentProgress>(`/progress/${studentId}`),
  update: (studentId: string, data: Partial<StudentProgress>) =>
    api.patch<StudentProgress>(`/progress/${studentId}`, data),
  getHistory: () => api.get<Booking[]>('/lessons/history'),
};

// Payments
export const paymentsAPI = {
  getPackages: () =>
    api.get<{
      [key: string]: { id: string; name: string; amount: number; lessons: number; description: string; currency: string };
    }>('/payments/packages'),
  create: (packageType: string) => api.post<Payment>('/payments', { packageType }),
  getMy: () => api.get<Payment[]>('/payments/my'),
  update: (paymentId: string, status: string) =>
    api.patch<Payment>(`/payments/${paymentId}`, { status }),
  getAdmin: () => api.get<{ payments: Payment[]; stats: any }>('/admin/payments'),
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get<Notification[]>('/notifications'),
  markAsRead: (notificationId: string) =>
    api.patch<Notification>(`/notifications/${notificationId}`, { isRead: true }),
};

// Messages
export const messagesAPI = {
  send: (receiverId: string, content: string) =>
    api.post<Message>('/messages', { receiverId, content }),
  getWith: (peerId: string) => api.get<Message[]>(`/messages/${peerId}`),
  getThreads: () => api.get<MessageThread[]>('/messages-threads'),
};

// Feedback
export const feedbackAPI = {
  submit: (studentId: string, ratingScore: number, evaluationNotes: string) =>
    api.post<Feedback>('/feedback', { studentId, ratingScore, evaluationNotes }),
  get: (studentId: string) => api.get<Feedback[]>(`/feedback/${studentId}`),
};

// Quiz
export const quizAPI = {
  getQuestions: (count = 10, code = 'both') =>
    api.get<QuizQuestion[]>('/quiz/questions', { params: { count, code } }),
  submitAttempt: (licenseCode: string, answers: Record<string, number>) =>
    api.post<QuizAttempt>('/quiz/attempt', { licenseCode, answers }),
  getMyAttempts: () => api.get<QuizAttempt[]>('/quiz/attempts'),
};

// Analytics (Admin)
export const analyticsAPI = {
  getDashboard: () =>
    api.get<{
      totalUsers: number;
      totalStudents: number;
      totalInstructors: number;
      totalBookings: number;
      completedBookings: number;
      totalTransactions: number;
      totalRevenue: number;
    }>('/admin/analytics'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;

