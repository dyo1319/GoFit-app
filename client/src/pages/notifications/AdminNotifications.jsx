import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Send as SendIcon,
  Preview as PreviewIcon,
  People as PeopleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import './AdminNotifications.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const NOTIFICATION_TYPES = {
  ADMIN_NOTIFICATION: 'admin_notification',
  WORKOUT_REMINDER: 'workout_reminder'
};

const NOTIFICATION_TYPE_LABELS = {
  admin_notification: 'התראת מנהל (כללי)',
  workout_reminder: 'תזכורת אימון'
};

export default function AdminNotifications() {
  const { authenticatedFetch } = useAuth();
  
  // Form state
  const [recipientType, setRecipientType] = useState('individual'); // individual, role, all
  const [selectedRole, setSelectedRole] = useState('trainee');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notificationType, setNotificationType] = useState('admin_notification');
  
  // UI state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await authenticatedFetch('/U/list');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setSnackbar({ open: true, message: 'שגיאה בטעינת משתמשים', severity: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSendNotification = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSending(true);
      
      // Determine user IDs based on recipient type
      let userIds = [];
      if (recipientType === 'individual') {
        userIds = selectedUsers.map(u => u.user_id || u.id);
      } else if (recipientType === 'role') {
        userIds = users.filter(u => u.role === selectedRole).map(u => u.user_id || u.id);
      } else if (recipientType === 'all') {
        userIds = users.map(u => u.user_id || u.id);
      }

      if (userIds.length === 0) {
        setSnackbar({ open: true, message: 'לא נבחרו משתמשים', severity: 'warning' });
        return;
      }

      // Prepare notification data
      const notificationData = {
        userIds,
        title,
        body,
        type: notificationType,
        data: {}
      };

      const response = await authenticatedFetch('/notifications/send', {
        method: 'POST',
        body: JSON.stringify(notificationData)
      });

      const data = await response.json();

      if (data.success) {
        setSnackbar({ 
          open: true, 
          message: `ההתראה נשלחה בהצלחה ל-${userIds.length} משתמשים`, 
          severity: 'success' 
        });
        
        // Reset form
        resetForm();
      } else {
        setSnackbar({ open: true, message: data.message || 'שגיאה בשליחת ההתראה', severity: 'error' });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setSnackbar({ open: true, message: 'שגיאה בשליחת ההתראה', severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      setSnackbar({ open: true, message: 'נא להזין כותרת', severity: 'warning' });
      return false;
    }
    if (!body.trim()) {
      setSnackbar({ open: true, message: 'נא להזין תוכן', severity: 'warning' });
      return false;
    }
    if (recipientType === 'individual' && selectedUsers.length === 0) {
      setSnackbar({ open: true, message: 'נא לבחור לפחות משתמש אחד', severity: 'warning' });
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setSelectedUsers([]);
    setRecipientType('individual');
  };

  const getRecipientCount = () => {
    if (recipientType === 'individual') {
      return selectedUsers.length;
    } else if (recipientType === 'role') {
      return users.filter(u => u.role === selectedRole).length;
    } else if (recipientType === 'all') {
      return users.length;
    }
    return 0;
  };

  const getRecipientSummary = () => {
    if (recipientType === 'individual') {
      return selectedUsers.map(u => u.name || u.email).join(', ');
    } else if (recipientType === 'role') {
      const roleLabels = {
        trainee: 'מתאמנים',
        trainer: 'מאמנים',
        admin: 'מנהלים'
      };
      return `כל ה${roleLabels[selectedRole]} (${getRecipientCount()})`;
    } else if (recipientType === 'all') {
      return `כל המשתמשים (${getRecipientCount()})`;
    }
    return '';
  };

  return (
    <Box className="admin-notifications-page" dir="rtl">
      <Box className="page-container">
        <Box className="page-header">
          <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SendIcon />
            שליחת התראות
          </Typography>
          <Typography variant="body1" color="textSecondary">
            שלח התראות מותאמות אישית למשתמשים, קבוצות או לכל המשתמשים במערכת
          </Typography>
        </Box>

        <Box className="admin-notifications-content">
          {/* Send Notification Form */}
          <Paper className="notification-form-paper" elevation={2} sx={{ direction: 'rtl' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, direction: 'rtl' }}>
              <SendIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ direction: 'rtl', textAlign: 'right', fontWeight: 700 }}>
                שליחת התראה חדשה
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {/* Recipient Type Selection */}
            <FormControl fullWidth sx={{ direction: 'rtl' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ direction: 'rtl', textAlign: 'right' }}>
                סוג נמענים
              </Typography>
              <RadioGroup
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
                sx={{ direction: 'rtl' }}
              >
                <FormControlLabel 
                  value="individual" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl', flexDirection: 'row-reverse' }}>
                      משתמשים ספציפיים
                      <PersonIcon fontSize="small" />
                    </Box>
                  }
                  sx={{ direction: 'rtl', flexDirection: 'row-reverse', marginLeft: 0, marginRight: 0 }}
                />
                <FormControlLabel 
                  value="role" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl', flexDirection: 'row-reverse' }}>
                      לפי תפקיד
                      <PeopleIcon fontSize="small" />
                    </Box>
                  }
                  sx={{ direction: 'rtl', flexDirection: 'row-reverse', marginLeft: 0, marginRight: 0 }}
                />
                <FormControlLabel 
                  value="all" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl', flexDirection: 'row-reverse' }}>
                      כל המשתמשים
                      <PeopleIcon fontSize="small" />
                    </Box>
                  }
                  sx={{ direction: 'rtl', flexDirection: 'row-reverse', marginLeft: 0, marginRight: 0 }}
                />
              </RadioGroup>
            </FormControl>

            {/* Individual Users Selection */}
            {recipientType === 'individual' && (
              <FormControl fullWidth sx={{ direction: 'rtl' }}>
                <Autocomplete
                  multiple
                  options={users}
                  getOptionLabel={(option) => `${option.username || option.email} (${option.role})`}
                  getOptionKey={(option) => option.user_id || option.id}
                  isOptionEqualToValue={(option, value) => (option.user_id || option.id) === (value.user_id || value.id)}
                  value={selectedUsers}
                  onChange={(event, newValue) => setSelectedUsers(newValue)}
                  loading={loadingUsers}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="בחר משתמשים"
                      placeholder="חפש משתמש..."
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={option.user_id || option.id}
                          label={option.username || option.email}
                          {...tagProps}
                          size="small"
                        />
                      );
                    })
                  }
                />
              </FormControl>
            )}

            {/* Role Selection */}
            {recipientType === 'role' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ direction: 'rtl', textAlign: 'right', mb: 1, fontWeight: 600, color: '#374151' }}>
                  תפקיד
                </Typography>
                <Select
                  fullWidth
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  sx={{ textAlign: 'right', direction: 'rtl' }}
                  displayEmpty
                >
                  <MenuItem value="trainee">מתאמנים</MenuItem>
                  <MenuItem value="trainer">מאמנים</MenuItem>
                  <MenuItem value="admin">מנהלים</MenuItem>
                </Select>
              </Box>
            )}

            {/* Recipient Count */}
            {getRecipientCount() > 0 && (
              <Alert severity="info" sx={{ mb: 4, direction: 'rtl', textAlign: 'right' }}>
                {getRecipientCount()} נמענים נבחרו
              </Alert>
            )}

            {/* Notification Type */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ direction: 'rtl', textAlign: 'right', mb: 1, fontWeight: 600, color: '#374151' }}>
                סוג התראה
              </Typography>
              <Select
                fullWidth
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
                sx={{ textAlign: 'right', direction: 'rtl' }}
              >
                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', direction: 'rtl', textAlign: 'right' }}>
                💡 התראות אוטומטיות (חידוש מנוי, תשלומים, תוכניות אימון) נשלחות על ידי המערכת
              </Typography>
            </Box>

            {/* Title */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ direction: 'rtl', textAlign: 'right', mb: 1, fontWeight: 600, color: '#374151' }}>
                כותרת <span style={{ color: '#d32f2f' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="הזן כותרת להתראה..."
                InputProps={{
                  sx: { '& input': { textAlign: 'right', direction: 'rtl' } }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', direction: 'rtl', textAlign: 'right' }}>
                כותרת ההתראה שתופיע למשתמש
              </Typography>
            </Box>

            {/* Body */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ direction: 'rtl', textAlign: 'right', mb: 1, fontWeight: 600, color: '#374151' }}>
                תוכן <span style={{ color: '#d32f2f' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                value={body}
                onChange={(e) => setBody(e.target.value)}
                multiline
                rows={4}
                placeholder="הזן את תוכן ההתראה..."
                InputProps={{
                  sx: { '& textarea': { textAlign: 'right', direction: 'rtl' } }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', direction: 'rtl', textAlign: 'right' }}>
                תוכן ההתראה המלא
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendNotification}
                disabled={sending || getRecipientCount() === 0}
                sx={{ flex: 1, minWidth: '200px' }}
              >
                {sending ? 'שולח...' : 'שלח התראה'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setPreviewOpen(true)}
                disabled={!title || !body}
                sx={{ minWidth: '150px' }}
              >
                תצוגה מקדימה
              </Button>
              <Button
                variant="text"
                onClick={resetForm}
                sx={{ minWidth: '100px' }}
              >
                איפוס
              </Button>
            </Box>
          </Paper>

        {/* Quick Tips */}
        <Paper className="tips-paper" elevation={1} sx={{ mt: 3, p: 3, direction: 'rtl', textAlign: 'right' }}>
          <Typography variant="h6" gutterBottom sx={{ direction: 'rtl', textAlign: 'right' }}>
            💡 טיפים ומידע חשוב
          </Typography>
          <List dense sx={{ direction: 'rtl' }}>
            <ListItem sx={{ direction: 'rtl', textAlign: 'right', alignItems: 'flex-start' }}>
              <ListItemText 
                primary="🤖 התראות אוטומטיות"
                secondary="המערכת שולחת אוטומטית: תזכורות חידוש מנוי, התראות תשלום, אישורי תשלום, והקצאת תוכניות אימון"
                sx={{ 
                  direction: 'rtl', 
                  textAlign: 'right',
                  '& .MuiListItemText-primary': { 
                    direction: 'rtl', 
                    textAlign: 'right' 
                  },
                  '& .MuiListItemText-secondary': { 
                    direction: 'rtl', 
                    textAlign: 'right' 
                  }
                }}
              />
            </ListItem>
            <ListItem sx={{ direction: 'rtl', textAlign: 'right', alignItems: 'flex-start' }}>
              <ListItemText 
                primary="✍️ כותרת קצרה וברורה"
                secondary="השתמש בכותרת תמציתית שמסבירה את מהות ההתראה"
                sx={{ 
                  direction: 'rtl', 
                  textAlign: 'right',
                  '& .MuiListItemText-primary': { 
                    direction: 'rtl', 
                    textAlign: 'right' 
                  },
                  '& .MuiListItemText-secondary': { 
                    direction: 'rtl', 
                    textAlign: 'right' 
                  }
                }}
              />
            </ListItem>
            <ListItem sx={{ direction: 'rtl', textAlign: 'right', alignItems: 'flex-start' }}>
              <ListItemText 
                primary="🎯 תוכן ממוקד"
                secondary="כתוב את המידע החשוב ביותר תחילה - משתמשים רואים רק את תחילת ההתראה"
                sx={{ 
                  direction: 'rtl', 
                  textAlign: 'right',
                  '& .MuiListItemText-primary': { 
                    direction: 'rtl', 
                    textAlign: 'right' 
                  },
                  '& .MuiListItemText-secondary': { 
                    direction: 'rtl', 
                    textAlign: 'right' 
                  }
                }}
              />
            </ListItem>
            <ListItem sx={{ direction: 'rtl', textAlign: 'right', alignItems: 'flex-start' }}>
              <ListItemText 
                primary="✅ בדוק את הנמענים"
                secondary="ודא שאתה שולח לקבוצת המשתמשים הנכונה לפני השליחה"
                sx={{ 
                  direction: 'rtl', 
                  textAlign: 'right',
                  '& .MuiListItemText-primary': { 
                    direction: 'rtl', 
                    textAlign: 'right' 
                  },
                  '& .MuiListItemText-secondary': { 
                    direction: 'rtl', 
                    textAlign: 'right' 
                  }
                }}
              />
            </ListItem>
          </List>
        </Paper>
      </Box>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth dir="rtl">
        <DialogTitle sx={{ direction: 'rtl', textAlign: 'right' }}>תצוגה מקדימה של ההתראה</DialogTitle>
        <DialogContent sx={{ direction: 'rtl' }}>
          <Card sx={{ mb: 2, direction: 'rtl' }}>
            <CardContent sx={{ direction: 'rtl' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, direction: 'rtl', flexDirection: 'row-reverse' }}>
                <Typography variant="caption" color="text.secondary" sx={{ direction: 'rtl' }}>
                  GoFit
                </Typography>
                <img src="/assests/logo.svg" alt="Logo" style={{ width: 24, height: 24 }} />
              </Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ direction: 'rtl', textAlign: 'right' }}>
                {title || 'כותרת ההתראה'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ direction: 'rtl', textAlign: 'right' }}>
                {body || 'תוכן ההתראה'}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ direction: 'rtl', textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ direction: 'rtl', textAlign: 'right' }}>
                  נמענים: {getRecipientSummary()}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ direction: 'rtl', textAlign: 'right' }}>
                  סוג: {NOTIFICATION_TYPE_LABELS[notificationType]}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>סגור</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setPreviewOpen(false);
              handleSendNotification();
            }}
            disabled={sending}
          >
            שלח עכשיו
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </Box>
  );
}

