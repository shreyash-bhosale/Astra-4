import { db } from '../db/store.js';
import { CreatePolicySchema } from '../validators/index.js';

export const listPolicies = async (req, res, next) => {
  try {
    const policies = db.find('policies');
    return res.json(policies);
  } catch (err) {
    next(err);
  }
};

export const getPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const policy = db.findById('policies', id);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    return res.json(policy);
  } catch (err) {
    next(err);
  }
};

export const createPolicy = async (req, res, next) => {
  try {
    const validated = CreatePolicySchema.parse(req.body);
    const policy = db.insert('policies', validated);
    return res.status(201).json(policy);
  } catch (err) {
    next(err);
  }
};

export const updatePolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = db.findById('policies', id);
    if (!existing) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    const updated = db.update('policies', id, req.body);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
};
