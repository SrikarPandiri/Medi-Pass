/**
 * @file server/db/repository.js
 * @description File-backed persistence repository layer with atomic disk sync,
 * hash-chained audit logging, and strictly isolated Guest sandbox execution.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import config from '../config.js';
import { createSeedData } from './seed.js';
import { createGuestSeed } from './guestSeed.js';

class Repository {
  constructor() {
    this.filePath = path.join(config.dataDir, 'db.json');
    this.state = null;
    this.guestSandboxes = new Map(); // guest_id -> sandbox state
    this.isWriting = false;
    this.writePending = false;
  }

  /**
   * Initializes database directory and loads or seeds initial data
   */
  async init() {
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.state = JSON.parse(raw);
      } catch (err) {
        console.error('[DB] Failed to parse db.json, reseeding:', err.message);
        this.state = await createSeedData();
        await this._persist();
      }
    } else {
      console.log('[DB] Seeding initial database...');
      this.state = await createSeedData();
      await this._persist();
      console.log('[DB] Database seeded successfully.');
    }
  }

  /**
   * Persists database state to disk safely
   */
  async _persist() {
    if (this.isWriting) {
      this.writePending = true;
      return;
    }
    this.isWriting = true;
    try {
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('[DB] Write error:', err);
    } finally {
      this.isWriting = false;
      if (this.writePending) {
        this.writePending = false;
        await this._persist();
      }
    }
  }

  // ==========================================
  // GUEST SANDBOX MANAGEMENT
  // ==========================================

  createGuestSandbox(role, guestId = crypto.randomUUID()) {
    const seed = createGuestSeed();
    const sandbox = {
      guest_id: guestId,
      role,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 2 * 3600000).toISOString(),
      patient: seed.patient,
      doctor: seed.doctor,
      doctorProfile: seed.doctorProfile,
      medicalRecords: [...seed.medicalRecords],
      consentSessions: [...seed.consentSessions],
      auditLogs: [...seed.auditLogs],
      chatThreads: [...seed.chatThreads],
      chatMessages: [...seed.chatMessages],
      emergencySessions: [...seed.emergencySessions]
    };
    this.guestSandboxes.set(guestId, sandbox);
    return sandbox;
  }

  getGuestSandbox(guestId) {
    return this.guestSandboxes.get(guestId) || null;
  }

  deleteGuestSandbox(guestId) {
    return this.guestSandboxes.delete(guestId);
  }

  // ==========================================
  // USERS & CREDENTIALS
  // ==========================================

  findUserById(userId, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        if (sb.patient && sb.patient.user_id === userId) return sb.patient;
        if (sb.doctor && sb.doctor.user_id === userId) return sb.doctor;
      }
      return null;
    }
    return this.state.users.find(u => u.user_id === userId) || null;
  }

  findUserByPhone(phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    return this.state.users.find(u => {
      const up = (u.phone_number || '').replace(/[^0-9]/g, '').slice(-10);
      return up === cleanPhone;
    }) || null;
  }

  findDoctorByLicense(licenseId) {
    const cred = this.state.doctorCredentials.find(
      c => c.license_id.trim().toUpperCase() === licenseId.trim().toUpperCase()
    );
    if (!cred) return null;
    const user = this.findUserById(cred.user_id);
    return user ? { ...user, credentials: cred } : null;
  }

  async createUser(user, credentials = null) {
    this.state.users.push(user);
    if (credentials) {
      if (user.role === 'patient') {
        this.state.patientCredentials.push({ user_id: user.user_id, ...credentials });
      } else if (user.role === 'doctor') {
        this.state.doctorCredentials.push({ user_id: user.user_id, ...credentials });
      }
    }
    await this._persist();
    return user;
  }

  async updateUser(userId, updates, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        if (sb.patient && sb.patient.user_id === userId) {
          Object.assign(sb.patient, updates);
          return sb.patient;
        }
        if (sb.doctor && sb.doctor.user_id === userId) {
          Object.assign(sb.doctor, updates);
          return sb.doctor;
        }
      }
      return null;
    }
    const idx = this.state.users.findIndex(u => u.user_id === userId);
    if (idx !== -1) {
      this.state.users[idx] = { ...this.state.users[idx], ...updates, updated_at: new Date().toISOString() };
      await this._persist();
      return this.state.users[idx];
    }
    return null;
  }

  getPatientCredentials(userId) {
    return this.state.patientCredentials.find(c => c.user_id === userId) || null;
  }

  async updatePatientCredentials(userId, updates) {
    const idx = this.state.patientCredentials.findIndex(c => c.user_id === userId);
    if (idx !== -1) {
      this.state.patientCredentials[idx] = { ...this.state.patientCredentials[idx], ...updates };
      await this._persist();
      return this.state.patientCredentials[idx];
    }
    return null;
  }

  getDoctorCredentials(userId) {
    return this.state.doctorCredentials.find(c => c.user_id === userId) || null;
  }

  async updateDoctorCredentials(userId, updates) {
    const idx = this.state.doctorCredentials.findIndex(c => c.user_id === userId);
    if (idx !== -1) {
      this.state.doctorCredentials[idx] = { ...this.state.doctorCredentials[idx], ...updates };
      await this._persist();
      return this.state.doctorCredentials[idx];
    }
    return null;
  }

  // ==========================================
  // AUTH SESSIONS
  // ==========================================

  async createAuthSession(session) {
    this.state.authSessions.push(session);
    await this._persist();
    return session;
  }

  findAuthSession(sessionId) {
    return this.state.authSessions.find(s => s.auth_session_id === sessionId) || null;
  }

  async revokeAuthSession(sessionId) {
    const s = this.state.authSessions.find(s => s.auth_session_id === sessionId);
    if (s) {
      s.revoked = true;
      await this._persist();
    }
    return s;
  }

  async revokeAllUserSessions(userId) {
    for (const s of this.state.authSessions) {
      if (s.user_id === userId) {
        s.revoked = true;
      }
    }
    await this._persist();
  }

  // ==========================================
  // MEDICAL RECORDS
  // ==========================================

  getRecordsByPatientId(patientId, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        return sb.medicalRecords.filter(r => r.patient_id === patientId || patientId === 'guest-patient-asha');
      }
      return [];
    }
    return this.state.medicalRecords.filter(r => r.patient_id === patientId);
  }

  async addRecord(record, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        sb.medicalRecords.unshift(record);
        return record;
      }
      return null;
    }
    this.state.medicalRecords.unshift(record);
    await this._persist();
    return record;
  }

  async updateRecordSyncStatus(recordId, syncStatus, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        const r = sb.medicalRecords.find(x => x.record_id === recordId);
        if (r) r.sync_status = syncStatus;
      }
      return;
    }
    const r = this.state.medicalRecords.find(x => x.record_id === recordId);
    if (r) {
      r.sync_status = syncStatus;
      await this._persist();
    }
  }

  // ==========================================
  // CONSENT SESSIONS
  // ==========================================

  async createConsentSession(session, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        sb.consentSessions.push(session);
        return session;
      }
    }
    this.state.consentSessions.push(session);
    await this._persist();
    return session;
  }

  findConsentSessionByJti(jti, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        return sb.consentSessions.find(s => s.jti === jti) || null;
      }
    }
    // Also search across all guest sandboxes if scanned by guest doctor
    for (const [, sb] of this.guestSandboxes) {
      const found = sb.consentSessions.find(s => s.jti === jti);
      if (found) return found;
    }
    return this.state.consentSessions.find(s => s.jti === jti) || null;
  }

  findConsentSessionById(sessionId, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        return sb.consentSessions.find(s => s.session_id === sessionId) || null;
      }
    }
    for (const [, sb] of this.guestSandboxes) {
      const found = sb.consentSessions.find(s => s.session_id === sessionId);
      if (found) return found;
    }
    return this.state.consentSessions.find(s => s.session_id === sessionId) || null;
  }

  async updateConsentSession(sessionId, updates, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        const s = sb.consentSessions.find(x => x.session_id === sessionId);
        if (s) {
          Object.assign(s, updates);
          return s;
        }
      }
    }
    for (const [, sb] of this.guestSandboxes) {
      const s = sb.consentSessions.find(x => x.session_id === sessionId);
      if (s) {
        Object.assign(s, updates);
        return s;
      }
    }
    const s = this.state.consentSessions.find(x => x.session_id === sessionId);
    if (s) {
      Object.assign(s, updates);
      await this._persist();
      return s;
    }
    return null;
  }

  // ==========================================
  // AUDIT LOGS (Hash-chained, tamper-evident)
  // ==========================================

  async addAuditLog(entry, guestId = null) {
    const list = guestId ? (this.getGuestSandbox(guestId)?.auditLogs || []) : this.state.auditLogs;
    const lastLog = list.length > 0 ? list[list.length - 1] : null;
    const prevHash = lastLog ? lastLog.current_hash : null;

    const dataToHash = `${entry.log_id || ''}|${entry.action}|${entry.timestamp}|${JSON.stringify(entry.metadata || {})}|${prevHash || 'ROOT'}`;
    const currentHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    const finalizedEntry = {
      log_id: entry.log_id || crypto.randomUUID(),
      session_id: entry.session_id || null,
      patient_id: entry.patient_id || null,
      doctor_id: entry.doctor_id || null,
      clinic_name: entry.clinic_name || 'System',
      action: entry.action,
      timestamp: entry.timestamp || new Date().toISOString(),
      metadata: entry.metadata || {},
      prev_hash: prevHash,
      current_hash: currentHash
    };

    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        sb.auditLogs.push(finalizedEntry);
      }
      return finalizedEntry;
    }

    this.state.auditLogs.push(finalizedEntry);
    await this._persist();
    return finalizedEntry;
  }

  getAuditLogsByPatientId(patientId, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        return sb.auditLogs.filter(l => l.patient_id === patientId || patientId === 'guest-patient-asha');
      }
      return [];
    }
    return this.state.auditLogs.filter(l => l.patient_id === patientId);
  }

  // ==========================================
  // EMERGENCY SESSIONS (Break-Glass / John Doe)
  // ==========================================

  async createEmergencySession(session, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        sb.emergencySessions.push(session);
        return session;
      }
    }
    this.state.emergencySessions.push(session);
    await this._persist();
    return session;
  }

  findEmergencySessionById(emergencyId, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        return sb.emergencySessions.find(e => e.emergency_id === emergencyId) || null;
      }
    }
    for (const [, sb] of this.guestSandboxes) {
      const found = sb.emergencySessions.find(e => e.emergency_id === emergencyId);
      if (found) return found;
    }
    return this.state.emergencySessions.find(e => e.emergency_id === emergencyId) || null;
  }

  async updateEmergencySession(emergencyId, updates, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        const item = sb.emergencySessions.find(e => e.emergency_id === emergencyId);
        if (item) {
          Object.assign(item, updates);
          return item;
        }
      }
    }
    const item = this.state.emergencySessions.find(e => e.emergency_id === emergencyId);
    if (item) {
      Object.assign(item, updates);
      await this._persist();
      return item;
    }
    return null;
  }

  // ==========================================
  // CHAT THREADS & MESSAGES
  // ==========================================

  getChatThreads(patientId, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) return sb.chatThreads.filter(t => !t.archived);
      return [];
    }
    return this.state.chatThreads.filter(t => t.patient_id === patientId && !t.archived);
  }

  getChatThreadById(threadId, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) return sb.chatThreads.find(t => t.thread_id === threadId) || null;
      return null;
    }
    return this.state.chatThreads.find(t => t.thread_id === threadId) || null;
  }

  async createChatThread(thread, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        sb.chatThreads.unshift(thread);
        return thread;
      }
    }
    this.state.chatThreads.unshift(thread);
    await this._persist();
    return thread;
  }

  async updateChatThread(threadId, updates, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        const t = sb.chatThreads.find(x => x.thread_id === threadId);
        if (t) Object.assign(t, updates);
        return t;
      }
    }
    const t = this.state.chatThreads.find(x => x.thread_id === threadId);
    if (t) {
      Object.assign(t, updates);
      await this._persist();
      return t;
    }
    return null;
  }

  async deleteChatThread(threadId, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        sb.chatThreads = sb.chatThreads.filter(t => t.thread_id !== threadId);
        sb.chatMessages = sb.chatMessages.filter(m => m.thread_id !== threadId);
        return true;
      }
    }
    this.state.chatThreads = this.state.chatThreads.filter(t => t.thread_id !== threadId);
    this.state.chatMessages = this.state.chatMessages.filter(m => m.thread_id !== threadId);
    await this._persist();
    return true;
  }

  getChatMessages(threadId, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) return sb.chatMessages.filter(m => m.thread_id === threadId);
      return [];
    }
    return this.state.chatMessages.filter(m => m.thread_id === threadId);
  }

  async addChatMessage(message, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        sb.chatMessages.push(message);
        return message;
      }
    }
    this.state.chatMessages.push(message);
    await this._persist();
    return message;
  }

  async updateMessageFeedback(messageId, feedback, guestId = null) {
    if (guestId) {
      const sb = this.getGuestSandbox(guestId);
      if (sb) {
        const m = sb.chatMessages.find(x => x.message_id === messageId);
        if (m) m.feedback = feedback;
        return m;
      }
    }
    const m = this.state.chatMessages.find(x => x.message_id === messageId);
    if (m) {
      m.feedback = feedback;
      await this._persist();
      return m;
    }
    return null;
  }
}

export const repository = new Repository();
export default repository;
