import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const resolveSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/web\/?$/, '');
  }

  return 'http://localhost:5000';
};

export const getSocket = (): Socket => {
  if (!socket) {
    const url = resolveSocketUrl();
    console.log('Initializing socket with URL:', url);
    socket = io(url, {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    console.log('Connecting socket (using cookies)...');
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};
