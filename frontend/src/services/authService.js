import api from "./api";

export const signup = (payload) => api.post("/auth/signup", payload).then((res) => res.data);
export const login = (payload) => api.post("/auth/login", payload).then((res) => res.data);
export const logout = () => api.post("/auth/logout").then((res) => res.data);
export const me = () => api.get("/auth/me").then((res) => res.data);

