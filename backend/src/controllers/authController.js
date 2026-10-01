import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/store.js';
import { config } from '../config/env.js';
import { getSupabaseClient } from '../db/supabaseClient.js';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../validators/index.js';

export const register = async (req, res, next) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const emailLower = validated.email.toLowerCase().trim();
    const existing = db.findOne('users', u => u.email.toLowerCase() === emailLower);

    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // STRICT SECURITY: Public registration ALWAYS assigns role = 'customer'
    // Ignores/overrides any client-supplied role (prevents admin/manager privilege escalation)
    const assignedRole = 'customer';

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
            phone: validated.phone || '',
            role: assignedRole
          }
        });

        if (supaErr) {
          if (supaErr.message?.includes('already registered') || supaErr.message?.includes('already been registered')) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
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
      phone: validated.phone || null,
      password_hash,
      role: assignedRole,
      voice_updates_enabled: false,
      voice_update_frequency: 'important',
      voice_call_start: '09:00',
      voice_call_end: '21:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      created_at: new Date().toISOString()
    });

    // 3. Automatically link / initialize customer record in CRM table
    let customer = db.findOne('customers', c => c.user_id === newUser.id || c.email.toLowerCase() === emailLower);
    if (!customer) {
      customer = db.insert('customers', {
        id: `cust-${Date.now().toString(36)}`,
        user_id: newUser.id,
        name: validated.name,
        email: emailLower,
        phone: validated.phone || null,
        tier: 'Standard',
        company: 'Individual Consumer',
        voice_updates_enabled: false,
        created_at: new Date().toISOString()
      });
    } else if (!customer.user_id) {
      db.update('customers', customer.id, { user_id: newUser.id });
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, customerId: customer.id },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        customerId: customer.id,
        voice_updates_enabled: false
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
              role: authData.user.user_metadata?.role || 'customer'
            });
          }

          if (validated.scope === 'staff' && user.role === 'customer') {
            return res.status(403).json({
              error: 'Staff access required',
              message: 'This account does not have permission to access the ResolveAI Staff Console.'
            });
          }

          let customer = null;
          if (user.role === 'customer') {
            customer = db.findOne('customers', c => c.user_id === user.id || c.email.toLowerCase() === emailLower);
            if (!customer) {
              customer = db.insert('customers', {
                id: `cust-${Date.now().toString(36)}`,
                user_id: user.id,
                name: user.name,
                email: user.email,
                tier: 'Standard',
                company: 'Individual Consumer',
                voice_updates_enabled: false,
                created_at: new Date().toISOString()
              });
            }
          }

          const token = authData.session?.access_token || jwt.sign(
            { id: user.id, email: user.email, role: user.role, customerId: customer?.id },
            config.jwtSecret,
            { expiresIn: '7d' }
          );

          return res.json({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              customerId: customer?.id
            },
            token,
            session: authData.session
          });
        }

        if (authError) {
          if (authError.message.includes('Email not confirmed')) {
            console.warn('[AUTH] Supabase unconfirmed email notice, proceeding to local check:', authError.message);
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

    if (validated.scope === 'staff' && user.role === 'customer') {
      return res.status(403).json({
        error: 'Staff access required',
        message: 'This account does not have permission to access the ResolveAI Staff Console.'
      });
    }

    let customer = null;
    if (user.role === 'customer') {
      customer = db.findOne('customers', c => c.user_id === user.id || c.email.toLowerCase() === emailLower);
      if (!customer) {
        customer = db.insert('customers', {
          id: `cust-${Date.now().toString(36)}`,
          user_id: user.id,
          name: user.name,
          email: user.email,
          tier: 'Standard',
          company: 'Individual Consumer',
          voice_updates_enabled: false,
          created_at: new Date().toISOString()
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, customerId: customer?.id },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: customer?.id
      },
      token
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res) => {
  const sessionUser = req.user ? (db.findById('users', req.user.id) || req.user) : null;
  return res.json({
    user: sessionUser ? {
      id: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email,
      phone: sessionUser.phone || null,
      department: sessionUser.department || null,
      role: sessionUser.role,
      customerId: req.user?.customerId || null
    } : null
  });
};

export const updateMe = async (req, res, next) => {
  try {
    const sessionUserId = req.user?.id;
    if (!sessionUserId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    let user = db.findById('users', sessionUserId) ||
               db.findOne('users', u => u.email.toLowerCase() === req.user.email?.toLowerCase());

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const { name, email, phone, department, currentPassword, newPassword } = req.body;
    const updates = {};

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (cleanName.length < 2) {
        return res.status(400).json({ error: 'Username/Name must be at least 2 characters.' });
      }
      updates.name = cleanName;
    }

    if (email !== undefined) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      if (cleanEmail !== user.email.toLowerCase()) {
        const existing = db.findOne('users', u => u.email.toLowerCase() === cleanEmail && u.id !== user.id);
        if (existing) {
          return res.status(400).json({ error: 'This email is already in use by another account.' });
        }
        updates.email = cleanEmail;
      }
    }

    if (phone !== undefined) {
      updates.phone = String(phone).trim() || null;
    }

    if (department !== undefined) {
      updates.department = String(department).trim() || null;
    }

    // Optional password update
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password.' });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }
      const isValid = bcrypt.compareSync(currentPassword, user.password_hash);
      if (!isValid) {
        return res.status(400).json({ error: 'Current password verification failed.' });
      }
      const salt = bcrypt.genSaltSync(10);
      updates.password_hash = bcrypt.hashSync(newPassword, salt);
    }

    const updatedUser = db.update('users', user.id, updates);

    // Also update Supabase Auth metadata if configured
    const supabase = getSupabaseClient();
    if (supabase && (updates.name || updates.phone || updates.email || updates.password_hash)) {
      try {
        const supaUpdates = {
          user_metadata: {
            name: updatedUser.name,
            phone: updatedUser.phone || '',
            department: updatedUser.department || ''
          }
        };
        if (updates.email) supaUpdates.email = updates.email;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
        if (isUuid) {
          await supabase.auth.admin.updateUserById(user.id, supaUpdates);
        }
      } catch (supaErr) {
        console.warn('[AUTH] Supabase admin updateUserById notice:', supaErr.message);
      }
    }

    // Generate refreshed JWT token with updated profile
    const token = jwt.sign(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        department: updatedUser.department,
        customerId: req.user.customerId || null
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Audit log
    db.logAudit({
      ticket_id: null,
      event_type: 'STAFF_PROFILE_UPDATED',
      agent: updatedUser.name,
      description: `Staff operator ${updatedUser.name} (${updatedUser.role}) updated their profile details`,
      metadata: { fieldsUpdated: Object.keys(updates) }
    });

    return res.json({
      success: true,
      message: 'Account details successfully updated.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        department: updatedUser.department,
        role: updatedUser.role
      },
      token
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const validated = ForgotPasswordSchema.parse(req.body);
    const emailLower = validated.email.toLowerCase().trim();

    // Check if user exists
    const user = db.findOne('users', u => u.email.toLowerCase() === emailLower);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.resetPasswordForEmail(emailLower, {
          redirectTo: `${req.protocol}://${req.get('host')}/reset-password`
        });
      } catch (supaErr) {
        console.warn('[AUTH] Supabase resetPassword notice:', supaErr.message);
      }
    }

    // Always return generic success to prevent account enumeration
    return res.json({
      success: true,
      message: 'If an account exists with this email address, a password reset link has been dispatched.'
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const validated = ResetPasswordSchema.parse(req.body);
    const emailLower = validated.email.toLowerCase().trim();

    const user = db.findOne('users', u => u.email.toLowerCase() === emailLower);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset request.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(validated.password, salt);

    db.update('users', user.id, { password_hash });

    const supabase = getSupabaseClient();
    if (supabase && user.id) {
      try {
        await supabase.auth.admin.updateUserById(user.id, {
          password: validated.password
        });
      } catch (supaErr) {
        console.warn('[AUTH] Supabase password update notice:', supaErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Password successfully updated. You may now sign in with your new credentials.'
    });
  } catch (err) {
    next(err);
  }
};

