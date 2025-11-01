import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  Box,
  Divider,
  Chip
} from '@mui/material';
import { 
  Notifications as NotificationsIcon, 
  Close, 
  Settings as SettingsIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './NotificationCenter.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function NotificationCenter() {
  const { authenticatedFetch } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  const fetchUnreadCount = async () => {
    try {
      const response = await authenticatedFetch('/notifications/unread-count');
      const data = await response.json();
      
      if (data.success) {
        setUnreadCount(data.unreadCount || 0);
        if (open) {
          fetchNotifications();
        }
      }
    } catch (error) {
      console.debug('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    let interval = null;
    let isActive = true;
    
    fetchUnreadCount();
    
    const startPolling = () => {
      if (interval) clearInterval(interval);
      if (document.visibilityState === 'visible' && isActive) {
        interval = setInterval(() => {
          if (document.visibilityState === 'visible' && isActive) {
            fetchUnreadCount();
          }
        }, 60000); 
      }
    };

    startPolling();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
        startPolling();
      } else {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleFocus = () => {
      if (isActive) {
        fetchUnreadCount();
      }
    };
    window.addEventListener('focus', handleFocus);

    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'NEW_NOTIFICATION' && isActive) {
        console.log('Service Worker: New notification received');
        fetchUnreadCount();
        if (open) {
          fetchNotifications();
        }
      }
    };
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      isActive = false;
      if (interval) {
        clearInterval(interval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [authenticatedFetch, open]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/notifications/history?limit=10&page=1');
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleGoToHistory = () => {
    handleClose();
    navigate('/app/notifications');
  };

  const handleGoToSettings = () => {
    handleClose();
    navigate('/app/notifications/settings');
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await authenticatedFetch(`/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true, read_at: new Date() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await authenticatedFetch('/notifications/read-all', {
        method: 'PUT'
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification.id);
    
    if (notification.data?.url) {
      const url = new URL(notification.data.url, window.location.origin);
      const path = url.pathname;
      const searchParams = new URLSearchParams(url.search);
      
      const navObj = {
        pathname: path,
        search: searchParams.toString() ? `?${searchParams.toString()}` : ''
      };
      
      navigate(navObj);
    }
    
    handleClose();
  };

  const getNotificationTypeLabel = (type) => {
    const labels = {
      subscription_renewal_3_days: 'חידוש מנוי',
      subscription_renewal_1_day: 'חידוש מנוי',
      subscription_expired: 'מנוי פג תוקף',
      subscription_created: 'מנוי חדש',
      subscription_updated: 'עדכון מנוי',
      subscription_paused: 'הקפאת מנוי',
      subscription_restored: 'שחזור מנוי',
      subscription_cancelled: 'ביטול מנוי',
      payment_due_3_days: 'תשלום',
      payment_due_1_day: 'תשלום',
      payment_overdue: 'תשלום מאוחר',
      payment_received: 'תשלום התקבל',
      training_program_assigned: 'תוכנית אימונים',
      workout_reminder: 'תזכורת אימון',
      admin_notification: 'התראה'
    };
    return labels[type] || 'התראה';
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        className="notification-icon"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        className="notification-popover"
      >
        <Box className="notification-popover-content">
          <Box className="notification-header">
            <Typography variant="h6">התראות</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                size="small" 
                onClick={handleGoToHistory}
                title="היסטוריית התראות"
                sx={{ color: 'text.secondary' }}
              >
                <HistoryIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={handleGoToSettings}
                title="הגדרות התראות"
                sx={{ color: 'text.secondary' }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={handleMarkAllAsRead}
                  sx={{ mr: 1 }}
                >
                  סמן הכל כנקרא
                </Button>
              )}
              <IconButton size="small" onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          <Divider />

          {loading ? (
            <Box className="notification-loading">
              <Typography variant="body2" color="text.secondary">
                טוען...
              </Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box className="notification-empty">
              <Typography variant="body2" color="text.secondary">
                אין התראות חדשות
              </Typography>
            </Box>
          ) : (
            <List className="notification-list">
              {notifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Chip
                            label={getNotificationTypeLabel(notification.type)}
                            size="small"
                            color="primary"
                            sx={{ height: 20 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <span style={{ display: 'block', marginBottom: '4px' }}>
                          {notification.body}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                          {new Date(notification.created_at).toLocaleDateString('he-IL', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
}

