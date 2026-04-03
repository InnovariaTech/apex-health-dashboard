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
        console.error('Auth bootstrap failed:', error);
        setAuthError({ type: 'unknown', message: error?.message || 'Failed to load' });
      } finally {
        setIsLoadingAuth(false);
      }
    };
    bootstrap();
  }, []);

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    mockAuth.logout();
  };

  const navigateToLogin = () => {
    mockAuth.redirectToLogin();
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
