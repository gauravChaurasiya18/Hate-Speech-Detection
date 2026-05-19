import { io } from "socket.io-client";
import api from "./api";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const socketBase = import.meta.env.VITE_SOCKET_URL || apiBase.replace(/\/api\/?$/, "");

export const createChatSocket = () =>
  io(socketBase, {
    withCredentials: true,
    transports: ["polling", "websocket"],
    timeout: 10000
  });

export const getRoomMessages = (room, params = {}) => api.get(`/chat/rooms/${room}/messages`, { params }).then((res) => res.data);
export const getChatAnalytics = (room) => api.get(`/chat/rooms/${room}/analytics`).then((res) => res.data);
export const getModerationQueue = (room) => api.get(`/chat/rooms/${room}/queue`).then((res) => res.data);
export const getToxicHistory = (room) => api.get(`/chat/rooms/${room}/toxic-history`).then((res) => res.data);
export const deleteChatMessage = (id) => api.delete(`/chat/messages/${id}`).then((res) => res.data);
export const muteChatUser = (room, userId, minutes = 15) => api.post(`/chat/rooms/${room}/mute`, { userId, minutes }).then((res) => res.data);
export const flagChatUser = (room, userId, reason) => api.post(`/chat/rooms/${room}/flag`, { userId, reason }).then((res) => res.data);
