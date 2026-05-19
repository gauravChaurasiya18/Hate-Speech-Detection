import api from "./api";

export const analyzeText = (text, options = {}) =>
  api
    .post(
      "/analyze",
      {
        text,
        save: options.save ?? true,
        explain: options.explain ?? true
      },
      {
        signal: options.signal
      }
    )
    .then((res) => res.data);

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post("/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    .then((res) => res.data);
};

export const getHistory = (params) => api.get("/history", { params }).then((res) => res.data);
export const deleteHistory = (id) => api.delete(`/history/${id}`).then((res) => res.data);
export const getDashboardStats = () => api.get("/dashboard/stats").then((res) => res.data);
