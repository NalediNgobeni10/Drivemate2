import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const authApi = {
  processSession: (session_id) => api.post("/auth/session", { session_id }),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  updateMe: (data) => api.patch("/me", data),
};

export const studentApi = {
  list: () => api.get("/students"),
  create: (data) => api.post("/students", data),
  update: (id, data) => api.patch(`/students/${id}`, data),
  remove: (id) => api.delete(`/students/${id}`),
  feedback: (id) => api.get(`/students/${id}/feedback`),
  addFeedback: (data) => api.post("/feedback", data),
};

export const slotApi = {
  list: () => api.get("/slots"),
  create: (data) => api.post("/slots", data),
  update: (id, data) => api.patch(`/slots/${id}`, data),
  remove: (id) => api.delete(`/slots/${id}`),
  book: (id) => api.post(`/slots/${id}/book`),
  cancel: (id) => api.post(`/slots/${id}/cancel`),
  sendReminder: (id) => api.post(`/slots/${id}/send-reminder`),
  runReminders: () => api.post(`/slots/run-reminders`),
  myLessons: () => api.get(`/my/lessons`),
};

export const vehicleApi = {
  list: () => api.get("/vehicles"),
  create: (data) => api.post("/vehicles", data),
  update: (id, data) => api.patch(`/vehicles/${id}`, data),
  service: (id) => api.post(`/vehicles/${id}/service`),
  remove: (id) => api.delete(`/vehicles/${id}`),
};

export const statsApi = {
  instructor: () => api.get("/instructor/stats"),
  adminAnalytics: () => api.get("/admin/analytics"),
};

export const adminApi = {
  listUsers: () => api.get("/admin/users"),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  payments: () => api.get("/admin/payments"),
  resetDemo: () => api.post("/admin/reset-demo"),
};

export const paymentApi = {
  packages: () => api.get("/payments/packages"),
  checkout: (data) => api.post("/payments/checkout", data),
  status: (sid) => api.get(`/payments/status/${sid}`),
  my: () => api.get("/payments/my"),
};

export const messageApi = {
  threads: () => api.get("/messages/threads"),
  with: (peerId) => api.get(`/messages/with/${peerId}`),
  send: (data) => api.post("/messages", data),
  directory: () => api.get("/users/directory"),
};

export const quizApi = {
  questions: (count = 10, code = "both") => api.get(`/quiz/questions?count=${count}&code=${code}`),
  submit: (data) => api.post("/quiz/attempt", data),
  myAttempts: () => api.get("/quiz/my-attempts"),
};
