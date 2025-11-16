import { Server } from 'socket.io';

let io: Server;

export const setupSocketIO = (socketServer: Server) => {
  io = socketServer;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    socket.on('join-room', (room: string) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export const emitNotification = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
  }
};
