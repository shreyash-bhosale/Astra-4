import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Look for .env.local or .env in workspace root or backend
const rootDir = path.resolve(__dirname, '../../../');
const backendDir = path.resolve(__dirname, '../../');

const envCandidates = [
  path.join(rootDir, '.env.local'),
  path.join(rootDir, '.env'),
  path.join(backendDir, '.env.local'),
  path.join(backendDir, '.env')
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

export const config = {
  port: process.env.PORT || 5001,
  jwtSecret: process.env.JWT_SECRET || 'resolveai-hackathon-jwt-secret-key-2026-very-secure',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-latest',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};
