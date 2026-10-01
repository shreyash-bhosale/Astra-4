import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/store.js';
import { config } from '../config/env.js';
import { RegisterSchema, LoginSchema } from '../validators/index.js';

export const register = async (req, res, next) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const existing = db.findOne('users', u => u.email.toLowerCase() === validated.email.toLowerCase());

    if (existing) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(validated.password, salt);

    const newUser = db.insert('users', {
      name: validated.name,
      email: validated.email.toLowerCase(),
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
      token
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const user = db.findOne('users', u => u.email.toLowerCase() === validated.email.toLowerCase());

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
