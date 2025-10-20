import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function firstAllowedRoute(user, hasPermission) {
  if (!user) return '/login';

  if (user.role === 'admin') return '/admin/permissions';

  if (user.role === 'trainer') {
    if (hasPermission('view_dashboard')) return '/admin';
    if (hasPermission('view_users')) return '/admin/users';
    if (hasPermission('view_subscriptions')) return '/admin/subscriptions';
    if (hasPermission('manage_notifications')) return '/admin/notifications';
    return '/app';
  }

  return '/app';
}

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const dest = React.useMemo(() => firstAllowedRoute(user, hasPermission), [user, hasPermission]);

  return (
    <Box sx={{ p: 6, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" fontWeight={800}>אין לך הרשאות לגשת לדף זה</Typography>
      <Typography color="text.secondary">אם לדעתך מדובר בטעות, פנה למנהל המערכת.</Typography>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
        <Button variant="contained" onClick={() => navigate(dest, { replace: true })}>
          מעבר למסך המתאים
        </Button>

        <Button variant="outlined" onClick={() => navigate('/app', { replace: true })}>
          עבור לאזור המשתמש
        </Button>
      </Stack>
    </Box>
  );
}
