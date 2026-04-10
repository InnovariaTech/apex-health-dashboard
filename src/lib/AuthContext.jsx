import React, { createContext, useState, useContext, useEffect } from 'react';
import { mockAuth } from '@/mocks/in-memory/mockApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const appPublicSettings = { id: 'mock', public_settings: {} };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setAuthError(null);
        const currentUser = await mockAuth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
      } catch (error) {
        if (error?.message === 'auth_required') {
          setAuthError({ type: 'auth_required', message: 'Please login to continue' });
        } else {
          console.error('Auth bootstrap failed:', error);
          setAuthError({ type: 'unknown', message: error?.message || 'Failed to load' });
        }
      } finally {
        setIsLoadingAuth(false);
      }
    };
    bootstrap();
  }, []);

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: 'auth_required', message: 'Please login to continue' });
    mockAuth.logout();
  };

  const navigateToLogin = () => {
    mockAuth.redirectToLogin();
  };

  const login = async ({ email, password }) => {
    const currentUser = await mockAuth.login({ email, password });
    setUser(currentUser);
    setIsAuthenticated(true);
    setAuthError(null);
    return currentUser;
  };

  const signup = async ({ full_name, email, phone, password }) => {
    const currentUser = await mockAuth.signup({ full_name, email, phone, password });
    setUser(currentUser);
    setIsAuthenticated(true);
    setAuthError(null);
    return currentUser;
  };

  const checkAppState = async () => {
    try {
      const currentUser = await mockAuth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      console.error('App state check failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      login,
      signup,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
