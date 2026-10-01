import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/store.js';
import { config } from '../config/env.js';
import { getSupabaseClient } from '../db/supabaseClient.js';
import { RegisterSchema, LoginSchema } from '../validators/index.js';

export const register = async (req, res, next) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const emailLower = validated.email.toLowerCase().trim();
    const existing = db.findOne('users', u => u.email.toLowerCase() === emailLower);

    if (existing) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(validated.password, salt);
    let userId = null;

    // 1. Provision user in Supabase Auth with auto-confirmed email
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: supaUser, error: supaErr } = await supabase.auth.admin.createUser({
          email: emailLower,
          password: validated.password,
          email_confirm: true,
          user_metadata: {
            name: validated.name,
            role: validated.role
          }
        });

        if (supaErr) {
          if (supaErr.message?.includes('already registered') || supaErr.message?.includes('already been registered')) {
            return res.status(400).json({ error: 'User already exists with this email' });
          }
          console.warn('[AUTH] Supabase admin.createUser notice:', supaErr.message);
        } else if (supaUser?.user) {
          userId = supaUser.user.id;
        }
      } catch (adminErr) {
        console.warn('[AUTH] Supabase admin error:', adminErr.message);
      }
    }

    // 2. Synchronize to application database user profile
    const newUser = db.insert('users', {
      ...(userId ? { id: userId } : {}),
      name: validated.name,
      email: emailLower,
      password_hash,
      role: validated.role
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      token,
      supabaseUserId: userId
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const emailLower = validated.email.toLowerCase().trim();

    // 1. Attempt Supabase Auth login if client is configured
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailLower,
          password: validated.password
        });

        if (!authError && authData?.user) {
          let user = db.findOne('users', u => u.id === authData.user.id || u.email.toLowerCase() === emailLower);
          if (!user) {
            const salt = bcrypt.genSaltSync(10);
            const password_hash = bcrypt.hashSync(validated.password, salt);
            user = db.insert('users', {
              id: authData.user.id,
              name: authData.user.user_metadata?.name || emailLower.split('@')[0],
              email: emailLower,
              password_hash,
              role: authData.user.user_metadata?.role || 'agent'
            });
          }

          const token = authData.session?.access_token || jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            config.jwtSecret,
            { expiresIn: '7d' }
          );

          return res.json({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            },
            token,
            session: authData.session
          });
        }

        if (authError) {
          if (authError.message.includes('Email not confirmed')) {
            return res.status(400).json({ error: 'Email confirmation required. Please verify your email before logging in.' });
          }
        }
      } catch (supaEx) {
        // Fall back to local check below
      }
    }

    // 2. Local database verification (for seeded users and local test runner)
    const user = db.findOne('users', u => u.email.toLowerCase() === emailLower);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = bcrypt.compareSync(validated.password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res) => {
  return res.json({ user: req.user });
};
