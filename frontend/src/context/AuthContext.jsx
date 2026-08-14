import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('getsy_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('getsy_token'));

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('getsy-logout', handleLogout);
    return () => window.removeEventListener('getsy-logout', handleLogout);
  }, []);

  const setSession = (userData, tokens) => {
    setUser(userData);
    setToken(tokens.accessToken);
    localStorage.setItem('getsy_user', JSON.stringify(userData));
    localStorage.setItem('getsy_token', tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem('getsy_refresh', tokens.refreshToken);
    }
  };

  const login = async (email, password) => {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setSession(data.user, data);
    return data;
  };

  const registerCustomer = async (formData) => {
    const data = await fetchApi('/auth/register/customer', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    setSession(data.user, data);
    return data;
  };

  const registerOwner = async (formData) => {
    const body = formData instanceof FormData ? formData : JSON.stringify(formData);
    const data = await fetchApi('/auth/register/owner', {
      method: 'POST',
      body,
    });
    setSession(data.user, data);
    return data;
  };

  const updateProfile = async (profileData) => {
    const data = await fetchApi('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
    if (data && data.name) {
      setUser((prev) => ({ ...prev, ...data }));
      localStorage.setItem('getsy_user', JSON.stringify({ ...user, ...data }));
    }
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('getsy_user');
    localStorage.removeItem('getsy_token');
    localStorage.removeItem('getsy_refresh');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isOwner: user?.role === 'owner',
        isCustomer: user?.role === 'customer',
        login,
        registerCustomer,
        registerOwner,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
