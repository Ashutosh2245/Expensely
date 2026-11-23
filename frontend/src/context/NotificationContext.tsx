import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem } from '../types';
import { notificationApi } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await notificationApi.getAll();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Could not fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshNotifications();

      const socket = getSocket();
      if (socket) {
        const handleNewNotification = (notif: NotificationItem) => {
          setNotifications((prev) => [notif, ...prev]);
          setUnreadCount((c) => c + 1);
          toast(notif.message, {
            icon: '🔔',
            duration: 5000,
            style: {
              background: '#0F172A',
              color: '#F8FAFC',
              border: '1px solid rgba(139, 92, 246, 0.4)'
            }
          });
        };

        socket.on('notification:new', handleNewNotification);

        return () => {
          socket.off('notification:new', handleNewNotification);
        };
      }
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, refreshNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Failed to mark notification read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark all read');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
