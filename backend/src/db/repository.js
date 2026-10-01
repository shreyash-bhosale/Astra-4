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
  'email_notifications'
];

export class Repository {
  constructor() {
    this.data = null;
    this.mode = config.databaseMode;
    this.supabase = null;
    this.initialized = false;
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
        // May be read-only filesystem in serverless environments
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
      this.syncWithSupabase().catch(err => {
        console.warn('[DATABASE] Supabase background sync notice:', err.message);
      });
    } else {
      console.log('[DATABASE] Active Mode: LOCAL JSON Store (Development/Demo Mode)');
    }

    this.initialized = true;
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
          const { data, error: fetchErr } = await this.supabase.from(table).select('*');
          if (!fetchErr && data && data.length > 0) {
            this.data[table] = data;
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
          if (error) {
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

  insert(tableName, record) {
    const table = this.getTable(tableName);
    const newRecord = {
      id: record.id || uuidv4(),
      ...record,
      created_at: record.created_at || new Date().toISOString()
    };
    table.push(newRecord);
    this.persistLocal();

    // Async write-through to Supabase
    if (this.supabase) {
      Promise.resolve(this.supabase.from(tableName).insert(newRecord)).catch(err => {
        console.warn(`[DATABASE] Supabase insert notice on ${tableName}:`, err.message);
      });
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

    // Async write-through to Supabase
    if (this.supabase) {
      Promise.resolve(this.supabase.from(tableName).update(updates).eq('id', id)).catch(err => {
        console.warn(`[DATABASE] Supabase update notice on ${tableName}:`, err.message);
      });
    }

    return table[index];
  }

  delete(tableName, id) {
    const table = this.getTable(tableName);
    const index = table.findIndex(item => item.id === id);
    if (index === -1) return false;

    table.splice(index, 1);
    this.persistLocal();

    // Async write-through to Supabase
    if (this.supabase) {
      Promise.resolve(this.supabase.from(tableName).delete().eq('id', id)).catch(err => {
        console.warn(`[DATABASE] Supabase delete notice on ${tableName}:`, err.message);
      });
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
