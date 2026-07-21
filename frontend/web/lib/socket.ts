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
      transports: ['polling', 'websocket'],
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
    });

    socket.on('connect', () => {
      console.info('Socket connected:', socket?.id, 'transport:', socket?.io.engine.transport.name);
      socket?.io.engine.once('upgrade', (transport) => {
        console.info('Socket transport upgraded:', transport.name);
      });
    });

    socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    socket.on('connect_error', (err: any) => {
      console.error('Socket connect error:', {
        message: err.message,
        description: err.description,
        context: err.context,
      });
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
