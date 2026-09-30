export const API_URL = '/api';
// import.meta.env.VITE_SOCKET_URL
export const SOCKET_URL = window.location.origin; // проксируется Vite'ом

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];
