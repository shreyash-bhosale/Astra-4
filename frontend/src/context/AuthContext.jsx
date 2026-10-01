import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          api.setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    api.setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const loginWithDemo = async (role = 'agent') => {
    let email = 'agent@resolveai.io';
    if (role === 'manager') email = 'manager@resolveai.io';
    if (role === 'admin') email = 'admin@resolveai.io';

    return await login(email, 'password123');
  };

  const register = async (name, email, password, role = 'agent') => {
    const res = await api.register({ name, email, password, role });
    api.setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithDemo, register, logout }}>
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
