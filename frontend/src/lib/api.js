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
};

export const statsApi = {
  instructor: () => api.get("/instructor/stats"),
};
