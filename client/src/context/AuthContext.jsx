import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToPushNotifications, isPushNotificationSupported, checkNotificationPermission } from '../services/pushNotificationService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth חייב להיות בשימוש בתוך AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  
  let navigate;
  try {
    navigate = useNavigate();
  } catch (error) {
    navigate = () => {
      console.warn('Navigation not available');
    };
  }

  const signOut = useCallback(() => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setUser(null);
    setPermissions([]);
    navigate('/login', { replace: true });
  }, [navigate]);

  const authenticatedFetch = useCallback(
    async (url, options = {}) => {
      const token = authToken || localStorage.getItem('authToken');

      if (!token) {
        signOut();
        throw new Error('נדרשת התחברות. אנא התחבר שוב.');
      }

      try {
        const fullUrl = url.startsWith('http')
          ? url
          : `${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}${url}`;

        const response = await fetch(fullUrl, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers,
          },
          credentials: 'include',
        });

        if (response.status === 401) {
          signOut();
          throw new Error('ההתחברות פגה. אנא התחבר שוב.');
        }

        return response;
      } catch (error) {
        if (
          error.message.includes('נדרשת התחברות') ||
          error.message.includes('ההתחברות פגה')
        ) {
          throw error;
        }
        if (error.name === 'AbortError') {
          throw error; // Re-throw AbortError so it can be handled properly
        }
        throw new Error('שגיאת רשת. אנא בדוק את החיבור שלך.');
      }
    },
    [authToken, signOut]
  );

  const fetchUserPermissions = useCallback(
    async (_userId, userRole) => {
      if (!_userId) {
        return;
      }
      if (userRole !== 'admin' && userRole !== 'trainer') {
        setPermissions([]);
        return;
      }

      try {
        const res = await authenticatedFetch(`/staff/me/effective`);
        if (res.ok) {
          const data = await res.json();
          const perms =
            data?.effective_permissions ??
            data?.items ??
            data?.permissions ??
            data?.perms ??
            [];
          setPermissions(Array.isArray(perms) ? perms : []);
        } else if (res.status === 403) {
          setPermissions([]);
        } else {
          setPermissions([]);
        }
      } catch (error) {
        setPermissions([]);
      }
    },
    [authenticatedFetch]
  );

  const signIn = async (phone, password) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}/auth/signin`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ phone_number: phone, password }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const { user: userData, token } = data;

        localStorage.setItem('authToken', token);
        setAuthToken(token);
        setUser(userData);

        await fetchUserPermissions(userData.id, userData.role);

        // Subscribe to push notifications if supported and permission already granted
        // We don't request permission here to avoid interrupting the login flow
        // Users can enable push notifications from the settings page
        if (isPushNotificationSupported()) {
          const permission = await checkNotificationPermission();
          if (permission === 'granted') {
            try {
              await subscribeToPushNotifications(token);
            } catch (error) {
              console.warn('Failed to subscribe to push notifications:', error);
              // Don't fail login if push subscription fails
            }
          }
        }

        return { success: true, user: userData };
      } else {
        const errorMsg = data.message || 'ההתחברות נכשלה';
        return { success: false, message: errorMsg };
      }
    } catch (error) {
      return { success: false, message: 'שגיאת רשת. אנא נסה שוב.' };
    } finally {
      setLoading(false);
    }
  };

  const didBootstrap = useRef(false);

  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;

    const bootstrap = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}/auth/verify`,
          {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
          }
        );

        if (res.ok) {
          const userData = await res.json();
          setAuthToken(token);
          setUser(userData);
          await fetchUserPermissions(userData.id, userData.role);
        } else {
          // Token is invalid or expired - clear it silently
          signOut();
        }
      } catch (err) {
        // Network error or invalid token - clear it silently
        console.debug('Token verification failed (expected on first load with no token):', err);
        signOut();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [fetchUserPermissions, signOut]);

  useEffect(() => {
    if (user || !localStorage.getItem('authToken')) {
      setLoading(false);
    }
  }, [user]);

  const hasPermission = useCallback(
    (permission) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return permissions.includes(permission);
    },
    [user, permissions]
  );

  const isAuthenticated = !!user;
  const isLoading = loading;

  const value = {
    user,
    permissions,
    authToken,
    loading,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    hasPermission,
    authenticatedFetch,
    fetchUserPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
