import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { getInitialData } from './seedData.js';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

const TABLES = [
  'users',
  'customers',
  'orders',
  'policies',
  'tickets',
  'agent_runs',
  'agent_steps',
  'approvals',
  'audit_logs',
  'email_notifications',
  'autonomy_settings',
  'supervisor_events',
  'agent_health'
];

export class Repository {
  constructor() {
    this.data = null;
    this.mode = config.databaseMode;
    this.supabase = null;
    this.initialized = false;
    this.pendingWrites = [];
    this.readyPromise = null;
    this.init();
  }

  init() {
    // 1. Strict Startup Validation for Production
    if (config.isProduction && this.mode === 'supabase') {
      if (!isSupabaseConfigured()) {
        const errorMsg =
          '[CRITICAL CONFIGURATION ERROR] NODE_ENV=production requires a persistent Supabase database!\n' +
          'Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your production environment variables.\n' +
          'ResolveAI will not silently fall back to ephemeral storage in production.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
    }

    // 2. Initialize In-Memory/Local Cache
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        // Read-only filesystem in serverless environments
      }
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.warn('[DATABASE] Corrupted local store file, resetting to initial seed:', err.message);
        this.data = getInitialData();
        this.persistLocal();
      }
    } else {
      this.data = getInitialData();
      this.persistLocal();
    }

    // 3. Supabase Integration
    if (isSupabaseConfigured()) {
      this.supabase = getSupabaseClient();
      console.log(`[DATABASE] Active Mode: SUPABASE PostgreSQL (${config.supabaseUrl})`);
      this.readyPromise = this.syncWithSupabase().catch(err => {
        console.warn('[DATABASE] Supabase initial sync notice:', err.message);
      });
    } else {
      console.log('[DATABASE] Active Mode: LOCAL JSON Store (Development/Demo Mode)');
      this.readyPromise = Promise.resolve();
    }

    this.initialized = true;
  }

  async ready() {
    if (this.readyPromise) {
      await this.readyPromise;
    }
    return true;
  }

  async flush() {
    if (this.pendingWrites.length === 0) return;
    const writes = [...this.pendingWrites];
    this.pendingWrites = [];
    const results = await Promise.allSettled(writes);
    for (const r of results) {
      if (r.status === 'rejected') {
        console.error('[DATABASE] Flush error on Supabase operation:', r.reason?.message || r.reason);
      }
    }
  }

  async refreshTable(tableName) {
    if (!this.supabase) return this.getTable(tableName);
    try {
      if (tableName === 'autonomy_settings') {
        // Try dedicated table first
        const { data, error } = await this.supabase.from('autonomy_settings').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          this.data['autonomy_settings'] = data;
          return this.getTable('autonomy_settings');
        }
        // Fall back to reading latest snapshot from audit_logs
        const { data: snapshots } = await this.supabase
          .from('audit_logs')
          .select('*')
          .eq('event_type', 'SYSTEM_AUTONOMY_SNAPSHOT')
          .order('created_at', { ascending: false })
          .limit(1);
        if (snapshots && snapshots.length > 0 && snapshots[0].metadata) {
          this.data['autonomy_settings'] = [snapshots[0].metadata];
        }
        return this.getTable('autonomy_settings');
      }

      const { data, error } = await this.supabase.from(tableName).select('*');
      if (!error && Array.isArray(data)) {
        this.data[tableName] = data;
      }
    } catch (err) {
      console.warn(`[DATABASE] refreshTable ${tableName} notice:`, err.message);
    }
    return this.getTable(tableName);
  }

  async syncWithSupabase() {
    if (!this.supabase) return;
    try {
      // Check if Supabase has data in tickets table
      const { data: remoteTickets, error } = await this.supabase
        .from('tickets')
        .select('id')
        .limit(1);

      if (error) {
        console.warn('[DATABASE] Supabase table check returned:', error.message);
        return;
      }

      if (!remoteTickets || remoteTickets.length === 0) {
        console.log('[DATABASE] Supabase empty. Seeding initial records to remote PostgreSQL...');
        await this.seedSupabase();
      } else {
        console.log('[DATABASE] Hydrating local state from Supabase PostgreSQL...');
        for (const table of TABLES) {
          try {
            const { data, error: fetchErr } = await this.supabase.from(table).select('*');
            if (!fetchErr && Array.isArray(data)) {
              const currentMap = new Map((this.data[table] || []).map(r => [r.id, r]));
              for (const remoteRecord of data) {
                const local = currentMap.get(remoteRecord.id);
                currentMap.set(remoteRecord.id, local ? { ...local, ...remoteRecord } : remoteRecord);
              }
              this.data[table] = Array.from(currentMap.values());
            } else if (table === 'autonomy_settings') {
              // Hydrate from snapshot in audit_logs if table not yet migrated
              const { data: snapshots } = await this.supabase
                .from('audit_logs')
                .select('*')
                .eq('event_type', 'SYSTEM_AUTONOMY_SNAPSHOT')
                .order('created_at', { ascending: false })
                .limit(1);
              if (snapshots && snapshots.length > 0 && snapshots[0].metadata) {
                this.data['autonomy_settings'] = [snapshots[0].metadata];
              }
            }
          } catch (tErr) {
            // Non-blocking for unmigrated auxiliary tables
          }
        }
        this.persistLocal();
      }
    } catch (err) {
      console.warn('[DATABASE] Sync error:', err.message);
    }
  }

  async seedSupabase() {
    if (!this.supabase) return;
    const initial = getInitialData();
    for (const table of TABLES) {
      const records = initial[table] || [];
      if (records.length > 0) {
        try {
          const { error } = await this.supabase.from(table).upsert(records);
          if (error && error.code !== 'PGRST205') {
            console.warn(`[DATABASE] Seeding ${table} in Supabase notice:`, error.message);
          }
        } catch (e) {
          // Ignore table insert conflicts
        }
      }
    }
  }

  persistLocal() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      // Read-only filesystem fallback in serverless/container environment
    }
  }

  getTable(tableName) {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
    }
    return this.data[tableName];
  }

  find(tableName, predicate = () => true) {
    const table = this.getTable(tableName);
    if (typeof predicate === 'function') {
      return table.filter(predicate);
    }
    return table.filter(item => {
      return Object.entries(predicate).every(([k, v]) => item[k] === v);
    });
  }

  findById(tableName, id) {
    const table = this.getTable(tableName);
    return table.find(item => item.id === id) || null;
  }

  findOne(tableName, predicate) {
    const results = this.find(tableName, predicate);
    return results.length > 0 ? results[0] : null;
  }

  async _executeSupabaseWrite(action, tableName, recordOrUpdates, id = null) {
    if (!this.supabase) return;
    try {
      // Sanitize columns for known table schema constraints
      let payload = recordOrUpdates;
      if (payload) {
        payload = { ...recordOrUpdates };
        if (tableName === 'agent_runs') {
          delete payload.tool_calls;
          delete payload.error_message;
          delete payload.created_at;
          delete payload.verification_result;
          delete payload.recovery_attempts;
        } else if (tableName === 'email_notifications') {
          delete payload.metadata;
          if (payload.html_body && !payload.body_html) {
            payload.body_html = payload.html_body;
          }
          delete payload.html_body;
          if (payload.ticket_id && !this.findById('tickets', payload.ticket_id)) {
            payload.ticket_id = null;
          }
          if (payload.customer_id && !this.findById('customers', payload.customer_id)) {
            payload.customer_id = null;
          }
        } else if (tableName === 'approvals') {
          delete payload.decision_type;
          delete payload.decision_maker;
          delete payload.rejection_reason;
        } else if (tableName === 'audit_logs') {
          if (payload.ticket_id && !this.findById('tickets', payload.ticket_id)) {
            payload.ticket_id = null;
          }
        } else if (tableName === 'tickets') {
          if (payload.order_id && !this.findById('orders', payload.order_id)) {
            payload.order_id = null;
          }
          if (payload.customer_id && !this.findById('customers', payload.customer_id)) {
            payload.customer_id = null;
          }
          if (payload.assigned_user_id && !this.findById('users', payload.assigned_user_id)) {
            payload.assigned_user_id = null;
          }
        }
      }

      if (action === 'insert') {
        const { error } = await this.supabase.from(tableName).upsert(payload);
        if (error) {
          // If table doesn't exist, store state snapshot in audit_logs for resilience
          if (error.code === 'PGRST205' && tableName === 'autonomy_settings') {
            await this.supabase.from('audit_logs').insert({
              id: 'sup-snap-' + Date.now(),
              ticket_id: null,
              event_type: 'SYSTEM_AUTONOMY_SNAPSHOT',
              agent: 'Supervisor',
              description: 'Autonomy state snapshot (persisted for serverless sync)',
              metadata: recordOrUpdates
            });
            return;
          }
          if (error.code === 'PGRST205' && tableName === 'supervisor_events') {
            await this.supabase.from('audit_logs').insert({
              id: 'sup-ev-' + Date.now(),
              ticket_id: null,
              event_type: 'SUPERVISOR_EVENT',
              agent: 'Supervisor',
              description: recordOrUpdates.title || recordOrUpdates.description || 'Supervisor Event',
              metadata: recordOrUpdates
            });
            return;
          }
          console.error(`[DATABASE] Supabase insert error on ${tableName}:`, error.message);
        }
      } else if (action === 'update') {
        const { error } = await this.supabase.from(tableName).update(payload).eq('id', id);
        if (error) {
          if (error.code === 'PGRST205' && tableName === 'autonomy_settings') {
            const current = this.findById('autonomy_settings', id);
            await this.supabase.from('audit_logs').insert({
              id: 'sup-snap-' + Date.now(),
              ticket_id: null,
              event_type: 'SYSTEM_AUTONOMY_SNAPSHOT',
              agent: 'Supervisor',
              description: 'Autonomy state update snapshot',
              metadata: current || recordOrUpdates
            });
            return;
          }
          console.error(`[DATABASE] Supabase update error on ${tableName} (id: ${id}):`, error.message);
        }
      } else if (action === 'delete') {
        const { error } = await this.supabase.from(tableName).delete().eq('id', id);
        if (error && error.code !== 'PGRST205') {
          console.error(`[DATABASE] Supabase delete error on ${tableName} (id: ${id}):`, error.message);
        }
      }
    } catch (err) {
      console.error(`[DATABASE] Supabase ${action} exception on ${tableName}:`, err.message);
    }
  }

  insert(tableName, record) {
    const table = this.getTable(tableName);
    const newRecord = {
      id: record.id || uuidv4(),
      ...record,
      created_at: record.created_at || new Date().toISOString()
    };
    table.push(newRecord);
    this.persistLocal();

    // Track write for serverless flush
    if (this.supabase) {
      const writePromise = this._executeSupabaseWrite('insert', tableName, newRecord);
      this.pendingWrites.push(writePromise);
    }

    return newRecord;
  }

  update(tableName, id, updates) {
    const table = this.getTable(tableName);
    const index = table.findIndex(item => item.id === id);
    if (index === -1) return null;

    table[index] = {
      ...table[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.persistLocal();

    // Track write for serverless flush
    if (this.supabase) {
      const writePromise = this._executeSupabaseWrite('update', tableName, updates, id);
      this.pendingWrites.push(writePromise);
    }

    return table[index];
  }

  delete(tableName, id) {
    const table = this.getTable(tableName);
    const index = table.findIndex(item => item.id === id);
    if (index === -1) return false;

    table.splice(index, 1);
    this.persistLocal();

    // Track write for serverless flush
    if (this.supabase) {
      const writePromise = this._executeSupabaseWrite('delete', tableName, null, id);
      this.pendingWrites.push(writePromise);
    }

    return true;
  }

  logAudit({ ticket_id, event_type, agent, description, metadata = {} }) {
    return this.insert('audit_logs', {
      ticket_id,
      event_type,
      agent,
      description,
      metadata
    });
  }

  reset() {
    this.data = getInitialData();
    this.persistLocal();
    if (this.supabase) {
      this.seedSupabase().catch(console.error);
    }
  }
}

export const db = new Repository();
