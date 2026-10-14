import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app')
        ? 'https://vynoracampus-2.onrender.com'
        : '/');

    socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true
    });

    socket.on('connect', () => {
      console.info('[Socket.IO] Connected to live campus channel:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection notice:', err.message);
    });
  }
  return socket;
}

export function subscribeToConversation(conversationId: string) {
  const s = getSocket();
  s.emit('join_conversation', { conversationId });
}

export function unsubscribeFromConversation(conversationId: string) {
  const s = getSocket();
  s.emit('leave_conversation', { conversationId });
}
