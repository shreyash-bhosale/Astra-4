import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

const mapAuthError = (err) => {
  const msg = err?.message || String(err);
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_grant')) {
    return 'Invalid email or password. Please check your credentials.';
  }
  if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'Email confirmation required. Please verify your email address before logging in.';
  }
  if (msg.includes('User already registered') || msg.includes('already exists')) {
    return 'An account with this email address already exists.';
  }
  if (msg.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (msg.includes('over_email_send_rate_limit') || msg.includes('rate limit') || msg.includes('Too many requests')) {
    return 'Too many login attempts. Please wait a moment before trying again.';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Network connection error. Unable to reach authentication server.';
  }
  return msg || 'Authentication failed. Please try again.';
};

const formatUserFromSupabase = (supaUser) => {
  if (!supaUser) return null;
  const role = supaUser.user_metadata?.role ||
    (supaUser.email?.includes('customer') ? 'customer' : supaUser.email?.includes('admin') ? 'admin' : supaUser.email?.includes('manager') ? 'manager' : 'agent');
  const name = supaUser.user_metadata?.name ||
    supaUser.email?.split('@')[0] || 'User';

  return {
    id: supaUser.id,
    email: supaUser.email,
    name,
    role
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // 1. If Supabase is configured, restore native browser session
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('[Supabase Auth] Session fetch error:', error.message);
          } else if (session?.user && mounted) {
            const formatted = formatUserFromSupabase(session.user);
            setUser(formatted);
            api.setToken(session.access_token);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('[Supabase Auth] Session restore exception:', e.message);
        }
      }

      // 2. Fallback to API token restoration (for local/demo mode)
      const token = api.getToken();
      if (token) {
        try {
          const res = await api.getMe();
          if (mounted && res?.user) {
            setUser(res.user);
          }
        } catch (err) {
          if (mounted) {
            api.setToken(null);
            setUser(null);
          }
        }
      }

      if (mounted) {
        setLoading(false);
      }
    };

    initAuth();

    // Set up Supabase Auth State Change listener
    let authListener = null;
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          const formatted = formatUserFromSupabase(session.user);
          setUser(formatted);
          api.setToken(session.access_token);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          api.setToken(null);
        }

        setLoading(false);
      });
      authListener = subscription;
    }

    return () => {
      mounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  const login = async (email, password, scope = 'any') => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Real Supabase Authentication
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (error) {
          throw new Error(mapAuthError(error));
        }

        if (data?.session && data?.user) {
          const formatted = formatUserFromSupabase(data.user);

          // Prevent role confusion: If attempting to login via /staff/login with customer account
          if (scope === 'staff' && formatted.role === 'customer') {
            await supabase.auth.signOut();
            api.setToken(null);
            setUser(null);
            throw new Error('Staff access required: This account does not have permission to access the ResolveAI Staff Console.');
          }

          api.setToken(data.session.access_token);
          setUser(formatted);
          return formatted;
        }
      } catch (err) {
        // If Supabase rejected credentials or email not confirmed or staff access denied, throw mapped error
        if (err.message && !err.message.includes('fetch')) {
          throw err;
        }
        // If Supabase was unreachable, attempt backend API login below
        console.warn('[Supabase Auth] Login fallback to API:', err.message);
      }
    }

    // 2. Backend API fallback
    try {
      const res = await api.login({ email: cleanEmail, password, scope });
      api.setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (apiErr) {
      throw new Error(mapAuthError(apiErr));
    }
  };

  const loginWithDemo = async (role = 'agent') => {
    let email = 'agent@resolveai.io';
    if (role === 'manager') email = 'manager@resolveai.io';
    if (role === 'admin') email = 'admin@resolveai.io';
    if (role === 'customer') email = 'customer@resolveai.io';

    return await login(email, 'password123');
  };

  const register = async (name, email, password, phone = '') => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Call backend registration endpoint to create user, profile, and auto-confirm in Supabase
    try {
      await api.register({
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        password,
        role: 'customer' // Strict customer role
      });
    } catch (regErr) {
      throw new Error(mapAuthError(regErr));
    }

    // 2. Immediately sign in with Supabase Auth to establish persistent session
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (!error && data?.session && data?.user) {
        const formatted = formatUserFromSupabase(data.user);
        api.setToken(data.session.access_token);
        setUser(formatted);
        return formatted;
      }
    }

    // 3. Fallback: log in via API
    return await login(cleanEmail, password);
  };

  const forgotPassword = async (email) => {
    return await api.forgotPassword(email.trim().toLowerCase());
  };

  const resetPassword = async (data) => {
    return await api.resetPassword(data);
  };

  const logout = async (redirectPath = null) => {
    try {
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('[Supabase Auth] Sign out error:', err.message);
    } finally {
      api.setToken(null);
      setUser(null);
      if (redirectPath) {
        window.location.href = redirectPath;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithDemo, register, forgotPassword, resetPassword, logout }}>
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
