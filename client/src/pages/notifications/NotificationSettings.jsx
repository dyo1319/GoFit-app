import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import { subscribeToPushNotifications, isPushNotificationSupported, checkNotificationPermission } from '../../services/pushNotificationService';
import './NotificationSettings.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function NotificationSettings() {
  const { authenticatedFetch, authToken } = useAuth();
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchPreferences();
    checkPushStatus();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await authenticatedFetch('/notifications/preferences');
      const data = await response.json();
      
      if (data.success) {
        setPreferences(data.preferences || {});
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const checkPushStatus = async () => {
    const supported = isPushNotificationSupported();
    const permission = await checkNotificationPermission();
    setPushEnabled(supported && permission === 'granted');
  };

  const handlePreferenceChange = async (type, enabled) => {
    try {
      setLoading(true);
      const newPreferences = { ...preferences, [type]: enabled };
      
      await authenticatedFetch('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences: newPreferences })
      });
      
      setPreferences(newPreferences);
      setSnackbar({ open: true, message: 'העדפות עודכנו בהצלחה', severity: 'success' });
    } catch (error) {
      console.error('Error updating preferences:', error);
      setSnackbar({ open: true, message: 'שגיאה בעדכון העדפות', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      setLoading(true);
      await subscribeToPushNotifications(authToken);
      setPushEnabled(true);
      setSnackbar({ open: true, message: 'התראות דחיפה הופעלו בהצלחה', severity: 'success' });
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      setSnackbar({ open: true, message: 'שגיאה בהפעלת התראות דחיפה', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const preferenceTypes = [
    { key: 'subscription_renewal', label: 'תזכורות חידוש מנוי' },
    { key: 'payment_due', label: 'תזכורות תשלום' },
    { key: 'payment_received', label: 'הודעות תשלום התקבל' },
    { key: 'training_program', label: 'תוכניות אימונים חדשות' },
    { key: 'workout_reminder', label: 'תזכורות אימון' },
    { key: 'admin_notification', label: 'התראות מנהל' }
  ];

  return (
    <Box className="notification-settings-page">
      <PageHeader title="הגדרות התראות" showBack={true} backUrl="/app" />
      
      <Paper className="notification-settings-container">
        <Box className="push-notifications-section">
          <Typography variant="h6" gutterBottom>
            התראות דחיפה (Push Notifications)
          </Typography>
          
          {!isPushNotificationSupported() ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              הדפדפן שלך אינו תומך בהתראות דחיפה
            </Alert>
          ) : !pushEnabled ? (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                התראות דחיפה לא מופעלות. לחץ על הכפתור להפעלה.
              </Alert>
              <Button
                variant="contained"
                onClick={handleEnablePush}
                disabled={loading}
              >
                הפעל התראות דחיפה
              </Button>
            </Box>
          ) : (
            <Alert severity="success" sx={{ mt: 2 }}>
              התראות דחיפה מופעלות
            </Alert>
          )}
        </Box>

        <Box className="preferences-section" sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            העדפות התראות
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            בחר אילו סוגי התראות תרצה לקבל
          </Typography>

          {preferenceTypes.map((pref) => (
            <FormControlLabel
              key={pref.key}
              control={
                <Switch
                  checked={preferences[pref.key] !== false}
                  onChange={(e) => handlePreferenceChange(pref.key, e.target.checked)}
                  disabled={loading}
                />
              }
              label={pref.label}
              sx={{ display: 'flex', mb: 2 }}
            />
          ))}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

