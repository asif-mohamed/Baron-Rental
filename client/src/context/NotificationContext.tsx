import { createContext, useContext, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';

interface NotificationContextType {
  socket: Socket | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const socket = io('http://localhost:5000', {
    autoConnect: true,
  });

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('booking:created', (booking) => {
      playNotificationSound();
      toast.success(`حجز جديد: ${booking.customer.fullName} - ${booking.car.brand} ${booking.car.model}`, {
        autoClose: 8000,
      });
    });

    socket.on('booking:pickup', (booking) => {
      playNotificationSound();
      toast.info(`تم استلام السيارة: ${booking.car.brand} ${booking.car.model}`, {
        autoClose: 5000,
      });
    });

    socket.on('booking:overdue', (booking) => {
      playNotificationSound();
      toast.error(`حجز متأخر: ${booking.bookingNumber}`, {
        autoClose: 10000,
      });
    });

    socket.on('booking:pickup_due', (booking) => {
      playNotificationSound();
      toast.warning(`موعد استلام اليوم: ${booking.customer.fullName}`, {
        autoClose: 8000,
      });
    });

    socket.on('maintenance:due', (car) => {
      playNotificationSound();
      toast.warning(`صيانة مستحقة: ${car.brand} ${car.model} (${car.plateNumber})`, {
        autoClose: 8000,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch((err) => console.log('Audio play failed:', err));
  };

  return (
    <NotificationContext.Provider value={{ socket }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
