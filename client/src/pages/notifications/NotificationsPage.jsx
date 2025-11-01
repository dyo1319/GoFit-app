import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Paper,
  Pagination,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import { DeleteOutline, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import './NotificationsPage.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function NotificationsPage() {
  const { authenticatedFetch } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [tab, setTab] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [page, tab]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const unreadOnly = tab === 1 ? 'true' : 'false';
      const response = await authenticatedFetch(
        `/notifications/history?page=${page}&limit=20&unread_only=${unreadOnly}`
      );
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setUnreadCount(data.unreadCount || 0);
        // Calculate read count
        const read = (data.notifications || []).filter(n => n.read).length;
        setReadCount(read);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification.id);
    
    // Navigate to notification URL if available
    if (notification.data?.url) {
      // Parse URL to get path and query params
      const url = new URL(notification.data.url, window.location.origin);
      const path = url.pathname;
      const searchParams = new URLSearchParams(url.search);
      
      // Build navigation object with query params
      const navObj = {
        pathname: path,
        search: searchParams.toString() ? `?${searchParams.toString()}` : ''
      };
      
      navigate(navObj);
    }
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
      setReadCount(prev => prev + unreadCount);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteReadNotifications = async () => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את כל ההתראות הנקראות?')) {
      return;
    }
    
    try {
      setDeleting(true);
      const response = await authenticatedFetch('/notifications/read', {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        // Refresh notifications list
        fetchNotifications();
        setReadCount(0);
      }
    } catch (error) {
      console.error('Error deleting read notifications:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation(); // Prevent triggering the list item click
    
    if (!window.confirm('האם אתה בטוח שברצונך למחוק התראה זו?')) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        // Remove from local state
        setNotifications(prev => {
          const updated = prev.filter(n => n.id !== notificationId);
          return updated;
        });
        // Update counts
        const deleted = notifications.find(n => n.id === notificationId);
        if (deleted && !deleted.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else if (deleted && deleted.read) {
          setReadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
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

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setPage(1);
  };

  return (
    <Box className="notifications-page">
      <PageHeader title="התראות" showBack={true} backUrl="/app" />
      
      <Paper className="notifications-container">
        <Box className="notifications-header">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 2 }}>
            <Tabs value={tab} onChange={handleTabChange}>
              <Tab label={`הכל (${notifications.length})`} />
              <Tab label={`לא נקרא (${unreadCount})`} />
            </Tabs>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {unreadCount > 0 && tab === 1 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleMarkAllAsRead}
                >
                  סמן הכל כנקרא
                </Button>
              )}
              {readCount > 0 && tab === 0 && (
                <Tooltip title="מחק כל ההתראות הנקראות">
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={handleDeleteReadNotifications}
                    disabled={deleting}
                    startIcon={<DeleteOutline />}
                  >
                    מחק נקראות ({readCount})
                  </Button>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>

        {loading ? (
          <Box className="notifications-loading">
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              טוען התראות...
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box className="notifications-empty">
            <Typography variant="body1" color="text.secondary">
              אין התראות
            </Typography>
          </Box>
        ) : (
          <>
            <List className="notifications-list">
              {notifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{ cursor: 'pointer', position: 'relative' }}
                  secondaryAction={
                    <Tooltip title="מחק התראה">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                        sx={{ 
                          color: 'error.main',
                          '&:hover': { backgroundColor: 'error.light', color: 'error.dark' }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={notification.read ? 400 : 600}>
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Chip
                            label={getNotificationTypeLabel(notification.type)}
                            size="small"
                            color="primary"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <span style={{ display: 'block', marginBottom: '4px', color: 'rgba(0, 0, 0, 0.6)' }}>
                          {notification.body}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                          {new Date(notification.created_at).toLocaleDateString('he-IL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
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

            {totalPages > 1 && (
              <Box className="notifications-pagination">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                  dir="rtl"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}

