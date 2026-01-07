import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { socket } = useSocket();

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchNotifications();

        if (socket) {
            socket.on('notification', (newNotification) => {
                // Filter: Only show if it matches my user ID or is global (userId === null)
                const user = JSON.parse(localStorage.getItem('user'));
                const currentUserId = user?.id;

                if (!newNotification.userId || newNotification.userId === currentUserId) {
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            });

            // Also listen to system events that might be critical
            socket.on('auction_update', (data) => {
                // We could construct a local notification if backend doesn't send one explicitly
                // But ideally backend sends the 'notification' event.
            });
        }

        return () => {
            if (socket) {
                socket.off('notification');
                socket.off('auction_update');
            }
        };
    }, [socket]);

    const markAsRead = async (id = null) => {
        try {
            await api.post('/notifications/read', { id });

            if (id) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Failed to mark read", error);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
