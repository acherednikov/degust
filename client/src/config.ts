export const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ?? window.location.origin;

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];
