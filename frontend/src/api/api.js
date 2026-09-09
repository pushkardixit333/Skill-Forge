import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

// Attach the stored token, if any, to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token is rejected or expired, clear the session and send the user
// back to the login screen rather than showing a confusing data error.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const loginRequest = (data) => api.post("/auth/login", data).then((r) => r.data);
export const registerRequest = (data) => api.post("/auth/register", data).then((r) => r.data);
export const fetchMe = () => api.get("/auth/me").then((r) => r.data);

// Trainees
export const fetchTrainees = (params) => api.get("/trainees", { params }).then((r) => r.data);
export const fetchTrainee = (id) => api.get(`/trainees/${id}`).then((r) => r.data);
export const createTrainee = (data) => api.post("/trainees", data).then((r) => r.data);
export const updateConsent = (id, data) => api.put(`/trainees/${id}/consent`, data).then((r) => r.data);

// Courses / Providers / Employers
export const fetchCourses = () => api.get("/courses").then((r) => r.data);
export const createCourse = (data) => api.post("/courses", data).then((r) => r.data);
export const fetchProviders = () => api.get("/providers").then((r) => r.data);
export const createProvider = (data) => api.post("/providers", data).then((r) => r.data);
export const fetchEmployers = () => api.get("/employers").then((r) => r.data);
export const createEmployer = (data) => api.post("/employers", data).then((r) => r.data);
export const verifyEmployer = (id, data) => api.put(`/employers/${id}/verify`, data).then((r) => r.data);

// Placements
export const fetchPlacements = (params) => api.get("/placements", { params }).then((r) => r.data);
export const createPlacement = (data) => api.post("/placements", data).then((r) => r.data);

// Follow-ups
export const fetchFollowUps = (params) => api.get("/followups", { params }).then((r) => r.data);
export const completeFollowUp = (id, data) => api.put(`/followups/${id}/complete`, data).then((r) => r.data);
export const attemptFollowUp = (id) => api.put(`/followups/${id}/attempt`).then((r) => r.data);
export const markNoResponse = (id) => api.put(`/followups/${id}/no-response`).then((r) => r.data);

// Analytics
export const fetchSummary = () => api.get("/analytics/summary").then((r) => r.data);
export const fetchByCourse = () => api.get("/analytics/by-course").then((r) => r.data);
export const fetchByDistrict = () => api.get("/analytics/by-district").then((r) => r.data);
export const fetchByProvider = () => api.get("/analytics/by-provider").then((r) => r.data);
export const fetchByDemographic = () => api.get("/analytics/by-demographic").then((r) => r.data);
export const fetchNonPlacementReasons = () => api.get("/analytics/non-placement-reasons").then((r) => r.data);
export const fetchAttritionReasons = () => api.get("/analytics/attrition-reasons").then((r) => r.data);
export const fetchWageProgression = () => api.get("/analytics/wage-progression").then((r) => r.data);
export const fetchRetentionCurve = () => api.get("/analytics/retention-curve").then((r) => r.data);
export const fetchSkillGaps = () => api.get("/analytics/skill-gaps").then((r) => r.data);

export default api;
