/**
 * @file server/index.js
 * @description Main entry point for MediPass Node.js server.
 * Boots Express, mounts security middleware, WebSocket hub, REST API endpoints, and serves client PWA assets.
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';

import config from './config.js';
import repository from './db/repository.js';
import wsHub from './ws/hub.js';
import errorHandler from './middleware/errorHandler.js';

// Route imports
import authPatientRoutes from './routes/authPatient.js';
import authDoctorRoutes from './routes/authDoctor.js';
import authGuestRoutes from './routes/authGuest.js';
import patientRoutes from './routes/patient.js';
import consentRoutes from './routes/consent.js';
import doctorRoutes from './routes/doctor.js';
import emergencyRoutes from './routes/emergency.js';
import ocrRoutes from './routes/ocr.js';
import syncRoutes from './routes/sync.js';
import auditRoutes from './routes/audit.js';
import chatRoutes from './routes/chat.js';
import ttsRoutes from './routes/tts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, '../client');

async function startServer() {
  // Initialize file-backed repository and seed data
  await repository.init();

  const app = express();
  const server = http.createServer(app);

  // Initialize WebSocket hub
  wsHub.init(server);

  // Security headers (tailored for CDN usage and inline demo styles)
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for simple CDN scripts in vanilla prototype
    crossOriginEmbedderPolicy: false
  }));

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // REST API Routes
  app.use('/api/auth/patient', authPatientRoutes);
  app.use('/api/auth/doctor', authDoctorRoutes);
  app.use('/api/auth/guest', authGuestRoutes);
  app.use('/api/patient', patientRoutes);
  app.use('/api/consent', consentRoutes);
  app.use('/api/doctor', doctorRoutes);
  app.use('/api/emergency', emergencyRoutes);
  app.use('/api/ocr', ocrRoutes);
  app.use('/api', syncRoutes); // provides /api/sync, /api/translate, /api/dev/sms-outbox
  app.use('/api/audit', auditRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/tts', ttsRoutes);

  // Serve static client assets
  app.use(express.static(clientDir));

  // Direct friendly routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });

  app.get('/patient', (req, res) => {
    res.redirect('/patient/login.html');
  });

  app.get('/doctor', (req, res) => {
    res.redirect('/doctor/login.html');
  });

  // Centralized Error Handler
  app.use(errorHandler);

  server.listen(config.port, config.host, () => {
    console.log(`\n============================================================`);
    console.log(`🏥 MediPass: Point-of-Care Health Record & Dynamic QR System`);
    console.log(`📡 Server running at http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}`);
    console.log(`👤 Patient Portal: http://localhost:${config.port}/patient/login.html`);
    console.log(`👨‍⚕️ Doctor Portal:  http://localhost:${config.port}/doctor/login.html`);
    console.log(`👀 Guest Mode:     Available on all login screens`);
    console.log(`🤖 AI Provider:    ${config.ai.provider.toUpperCase()} (Grounding active)`);
    console.log(`============================================================\n`);
  });

  return server;
}

startServer().catch(err => {
  console.error('[Server Error] Startup failed:', err);
  process.exit(1);
});

export default startServer;
