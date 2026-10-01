import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { db } from '../db/store.js';
import { getSupabaseClient } from '../db/supabaseClient.js';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is missing or malformed.'
    });
  }

  const token = authHeader.split(' ')[1];

  // 1. First, check if token is a Supabase Auth access_token
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: supaAuth, error: supaErr } = await supabase.auth.getUser(token);
      if (!supaErr && supaAuth?.user) {
        const supaUser = supaAuth.user;
        let localUser = db.findOne('users', u => u.id === supaUser.id || u.email.toLowerCase() === supaUser.email?.toLowerCase());

        const customerRole = supaUser.user_metadata?.role || localUser?.role || 'customer';
        const customer = customerRole === 'customer'
          ? db.findOne('customers', c => c.user_id === supaUser.id || c.email.toLowerCase() === supaUser.email?.toLowerCase())
          : null;

        req.user = {
          id: supaUser.id,
          name: supaUser.user_metadata?.name || localUser?.name || supaUser.email?.split('@')[0] || 'User',
          email: supaUser.email,
          role: customerRole,
          ...(customer ? { customerId: customer.id } : {})
        };

        return next();
      }
    } catch (supaErr) {
      // Continue to local JWT verify
    }
  }

  // 2. Fallback to local JWT verification (for unit tests and local tokens)
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    let user = db.findById('users', decoded.id) || db.findOne('users', u => u.email.toLowerCase() === decoded.email?.toLowerCase());

    if (!user) {
      if (decoded.email) {
        user = db.insert('users', {
          id: decoded.id || `usr-${Date.now()}`,
          name: decoded.name || decoded.email.split('@')[0],
          email: decoded.email,
          role: decoded.role || 'customer'
        });
      } else {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User account no longer exists.'
        });
      }
    }

    const customer = user.role === 'customer'
      ? db.findOne('customers', c => c.user_id === user.id || c.email.toLowerCase() === user.email?.toLowerCase())
      : null;

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...(customer ? { customerId: customer.id } : (decoded.customerId ? { customerId: decoded.customerId } : {}))
    };

    return next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token.'
    });
  }
};

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required prior to role verification.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Role '${req.user.role}' is not authorized to access this resource. Required role(s): [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
};
