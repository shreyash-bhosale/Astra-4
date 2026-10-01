import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { getInitialData } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

class Store {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.warn('Corrupted store file, resetting to initial seed:', err.message);
        this.reset();
      }
    } else {
      this.reset();
    }
  }

  reset() {
    this.data = getInitialData();
    this.persist();
  }

  persist() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to persist store:', err);
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
    this.persist();
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
    this.persist();
    return table[index];
  }

  delete(tableName, id) {
    const table = this.getTable(tableName);
    const index = table.findIndex(item => item.id === id);
    if (index === -1) return false;

    table.splice(index, 1);
    this.persist();
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
}

export const db = new Store();
