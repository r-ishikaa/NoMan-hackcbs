import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/api';

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
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);

  // Check for existing token on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('hexagon_token');
      if (storedToken) {
        setToken(storedToken);
        await fetchUserProfile(storedToken);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setLoading(false);
    }
  };

  const fetchUserProfile = async (authToken) => {
    if (!authToken) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(API_CONFIG.getApiUrl('/users/me'), {
        headers: API_CONFIG.getAuthHeaders(authToken),
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setRole(userData.role || null);
      } else if (response.status === 401) {
        // Token is invalid or expired, remove it
        console.log('Token expired or invalid, logging out');
        await AsyncStorage.removeItem('hexagon_token');
        setToken(null);
        setUser(null);
        setRole(null);
      } else {
        console.error('Failed to fetch user profile:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (authToken) => {
    try {
      setToken(authToken);
      await AsyncStorage.setItem('hexagon_token', authToken);
      await fetchUserProfile(authToken);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      setRole(null);
      await AsyncStorage.removeItem('hexagon_token');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (requiredRole) => {
    if (!requiredRole) return true;
    return role === requiredRole;
  };

  const refreshUser = async () => {
    const storedToken = await AsyncStorage.getItem('hexagon_token');
    if (storedToken) {
      await fetchUserProfile(storedToken);
    }
  };

  const value = {
    user,
    token,
    loading,
    role,
    login,
    logout,
    isAuthenticated,
    hasRole,
    fetchUserProfile,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

