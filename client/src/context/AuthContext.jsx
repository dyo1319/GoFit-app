import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const signOut = useCallback(() => {
    console.log('Signing out user...');
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
        console.error('No authentication token available, redirecting to login');
        signOut();
        throw new Error('Authentication required. Please sign in again.');
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
          console.warn('Token expired or invalid, signing out');
          signOut();
          throw new Error('Session expired. Please sign in again.');
        }

        return response;
      } catch (error) {
        if (
          error.message.includes('Authentication required') ||
          error.message.includes('Session expired')
        ) {
          throw error;
        }
        console.error('Network error in authenticatedFetch:', error);
        throw new Error('Network error. Please check your connection.');
      }
    },
    [authToken, signOut]
  );

  const fetchUserPermissions = useCallback(
    async (_userId, userRole) => {
      if (!_userId) {
        console.warn('No user ID provided for permission fetch');
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
          console.log('User permissions fetched:', perms);
        } else if (res.status === 403) {
          console.log('User does not have staff permissions (403 Forbidden)');
          setPermissions([]);
        } else {
          console.error('Failed to fetch user permissions, status:', res.status);
          setPermissions([]);
        }
      } catch (error) {
        console.error('Error fetching user permissions:', error);
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

        console.log('User signed in successfully:', userData.username);

        await fetchUserPermissions(userData.id, userData.role);

        return { success: true, user: userData };
      } else {
        const errorMsg = data.message || 'Sign in failed';
        console.error('Sign in error:', errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (error) {
      console.error('Network error during sign in:', error);
      return { success: false, message: 'Network error. Please try again.' };
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
          console.log('User authenticated from stored token');
        } else {
          console.warn('Stored token invalid, signing out');
          signOut();
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
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
