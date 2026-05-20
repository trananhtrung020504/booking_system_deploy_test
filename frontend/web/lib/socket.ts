import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://127.0.0.1:5000';
    console.log('Initializing socket with URL:', url);
    socket = io(url, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true',
      },
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
