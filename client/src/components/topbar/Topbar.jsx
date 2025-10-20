import React, { useState, useEffect, useRef } from "react";
import "./topbar.css";
import { Notifications, MarkEmailRead } from "@mui/icons-material";
import { 
  IconButton, 
  Badge, 
  Popover, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Typography,
  Box,
  Button,
  Chip,
  Divider
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";

export default function Topbar() {
  const { authenticatedFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);
  const popoverRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/notifications?page=1&pageSize=5&onlyUnread=0`);
      if (response.ok) {
        const data = await response.json();
        const items = data?.data?.items || data?.data || [];
        setNotifications(items);
        const unread = items.filter(notification => !notification.read_at).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const markAsRead = async (notificationId) => {
    try {
      const response = await authenticatedFetch(`/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read_at: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await authenticatedFetch(`/notifications/read-all`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationsClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'עכשיו';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays === 1) return 'אתמול';
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    
    return date.toLocaleDateString('he-IL');
  };

  const getTypeColor = (type) => {
    const colors = {
      info: '#2196f3',
      warning: '#ff9800',
      error: '#f44336',
      success: '#4caf50'
    };
    return colors[type] || '#757575';
  };

  useEffect(() => {
    if (!open) return;

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [open]);

  return (
    <div className="topbar">
      <div className="topbarWrapper">
        <div className="topLeft">
          <span className="logo">GoFit</span>
        </div>
        <div className="topRight">
          <IconButton 
            color="inherit" 
            onClick={handleNotificationsClick}
            sx={{ mr: 2 }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>
        </div>
      </div>

      <Popover
        ref={popoverRef}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiPopover-paper': {
            width: 400,
            maxHeight: 500,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }
        }}
        dir="rtl"
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              התראות ({unreadCount} לא נקראו)
            </Typography>
            {unreadCount > 0 && (
              <Button 
                size="small" 
                startIcon={<MarkEmailRead />}
                onClick={markAllAsRead}
                disabled={loading}
              >
                סמן הכל כנקרא
              </Button>
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                טוען התראות...
              </Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Notifications sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                אין התראות חדשות
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    borderLeft: `4px solid ${getTypeColor(notification.type)}`,
                    backgroundColor: notification.read_at ? 'transparent' : 'action.hover',
                    mb: 1,
                    borderRadius: 1,
                    alignItems: 'flex-start'
                  }}
                  secondaryAction={
                    !notification.read_at && (
                      <IconButton 
                        edge="end" 
                        size="small"
                        onClick={() => markAsRead(notification.id)}
                        title="סמן כנקרא"
                      >
                        <MarkEmailRead fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: getTypeColor(notification.type)
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: notification.read_at ? 'normal' : 'bold',
                            mb: 0.5
                          }}
                        >
                          {notification.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: '0.875rem',
                            lineHeight: 1.4
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Chip 
                            label={notification.type} 
                            size="small" 
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(notification.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}

          {notifications.length > 0 && (
            <>
              <Divider sx={{ mt: 2, mb: 2 }} />
              <Box sx={{ textAlign: 'center' }}>
                <Button 
                  variant="text" 
                  size="small" 
                  fullWidth
                  href="/admin/notifications"
                  onClick={handleClose}
                >
                  הצג כל ההתראות
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Popover>
    </div>
  );
}