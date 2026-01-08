import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

export const NotificationContext = createContext();

// export const useNotifications = () => useContext(NotificationContext); // Moved to hooks/useNotifications.js

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { socket } = useSocket();
    const { token } = useAuth();

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            console.log("Fetched Notifications:", res.data); // DEBUG Log
            // Ensure data is an array
            if (Array.isArray(res.data)) {
                setNotifications(res.data);
                setUnreadCount(res.data.filter(n => !n.isRead).length);
            } else {
                console.error("API did not return an array", res.data);
                setNotifications([]);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }

        if (socket) {
            socket.on('notification', (newNotification) => {
                const user = JSON.parse(localStorage.getItem('user'));
                const currentUserId = user?.id;

                if (!newNotification.userId || newNotification.userId === currentUserId) {
                    setNotifications(prev => {
                        // Assign temp ID if missing (for Global Socket events)
                        const processedNote = {
                            ...newNotification,
                            id: newNotification.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                        };

                        // Prevent duplicates based on real ID (if exists)
                        if (newNotification.id && prev.some(n => n.id === newNotification.id)) return prev;

                        return [processedNote, ...prev];
                    });
                    setUnreadCount(prev => prev + 1);

                    // Immediately fetch fresh data from DB to get the REAL ID for this notification
                    // This ensures "Mark as Read" works because the temp ID is replaced by the DB ID.
                    fetchNotifications();
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('notification');
            }
        };
    }, [socket, token]);


    const markAsRead = async (id = null) => {
        try {
            console.log("Marking Read:", id);
            await api.post('/notifications/read', { id });

            if (id) {
                // Optimistic Update
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else {
                // Mark All Optimistic
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }

            // Sync with backend to ensure consistency (handles ghost IDs etc)
            await fetchNotifications();
            toast.success("Notifications updated");
        } catch (error) {
            console.error("Failed to mark read", error);
            toast.error("Failed to mark read");
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
