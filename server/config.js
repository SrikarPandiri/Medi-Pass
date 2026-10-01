/**
 * @file server/config.js
 * @description Centralized application configuration, environment settings, and secrets.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // JWT configuration
  jwt: {
    patientSecret: process.env.JWT_PATIENT_SECRET || 'medipass_patient_jwt_secret_dev_32char_key!',
    doctorSecret: process.env.JWT_DOCTOR_SECRET || 'medipass_doctor_jwt_secret_dev_32char_key!',
    guestSecret: process.env.JWT_GUEST_SECRET || 'medipass_guest_jwt_secret_dev_32char_key!',
    consentSecret: process.env.JWT_CONSENT_SECRET || 'medipass_consent_qr_secret_dev_32char_key!',
    
    // Audiences
    patientAudience: 'medipass-patient',
    doctorAudience: 'medipass-doctor',
    guestAudience: 'medipass-guest',
    consentAudience: 'medipass-consent',

    // Expirations
    accessExpiry: '15m',
    refreshExpiry: '30d',
    guestExpiry: '2h',
    qrExpirySeconds: 45,
    breakGlassCountdownSeconds: 60
  },

  // AI Assistant configuration
  ai: {
    provider: process.env.AI_PROVIDER || 'mock',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || ''
  },

  // Rate Limiting
  rateLimit: {
    authWindowMs: 15 * 60 * 1000, // 15 minutes
    authMaxAttempts: 5,
    chatWindowMs: 60 * 60 * 1000, // 1 hour
    chatMaxPerHour: 30
  },

  // Data persistence
  dataDir: path.resolve(__dirname, '../data')
};

export default config;
