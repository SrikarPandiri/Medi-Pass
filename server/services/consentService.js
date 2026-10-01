/**
 * @file server/services/consentService.js
 * @description Consent lifecycle engine: rolling dynamic QR issuance, anti-replay guards,
 * scope filtering, and instant WebSocket kill-switch revocation.
 */

import crypto from 'crypto';
import repository from '../db/repository.js';
import { TokenService } from './tokenService.js';
import { wsHub } from '../ws/hub.js';
import config from '../config.js';

class ConsentService {
  /**
   * Initiates a new rolling consent session for a patient
   */
  async createSession(patientId, scopes = ['allergies', 'prescriptions', 'lab_reports', 'vitals'], guestId = null) {
    const sessionId = crypto.randomUUID();
    const tokenData = TokenService.generateConsentToken(patientId, sessionId, scopes);

    const session = {
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: null,
      qr_token: tokenData.qrToken,
      jti: tokenData.jti,
      status: 'active',
      scopes,
      expires_at: new Date(Date.now() + config.jwt.qrExpirySeconds * 1000).toISOString(),
      created_at: new Date().toISOString()
    };

    await repository.createConsentSession(session, guestId);

    return {
      session_id: sessionId,
      qr_token: tokenData.qrToken,
      expires_in: config.jwt.qrExpirySeconds,
      scopes
    };
  }

  /**
   * Rotates a rolling QR token within an active session, invalidating the previous JTI
   */
  async rotateToken(sessionId, patientId, guestId = null) {
    const session = repository.findConsentSessionById(sessionId, guestId);
    if (!session) {
      // If not found, create new session seamlessly
      return this.createSession(patientId, ['allergies', 'prescriptions', 'lab_reports', 'vitals'], guestId);
    }

    if (session.status !== 'active') {
      throw new Error(`Cannot rotate token for session with status: ${session.status}`);
    }

    const tokenData = TokenService.generateConsentToken(patientId, sessionId, session.scopes);

    await repository.updateConsentSession(sessionId, {
      qr_token: tokenData.qrToken,
      jti: tokenData.jti,
      expires_at: new Date(Date.now() + config.jwt.qrExpirySeconds * 1000).toISOString()
    }, guestId);

    return {
      session_id: sessionId,
      qr_token: tokenData.qrToken,
      expires_in: config.jwt.qrExpirySeconds,
      scopes: session.scopes
    };
  }

  /**
   * Validates scanned QR token, enforces anti-replay, binds doctor, and returns scoped records
   */
  async verifyAndConsume(qrToken, doctorId, guestId = null) {
    const startTime = Date.now();

    // 1. Verify token signature and audience
    const decoded = TokenService.verifyConsentToken(qrToken);
    if (!decoded) {
      throw new Error('QR token is invalid, expired, or tampered with.');
    }

    const { jti, session_id, patient_id, scopes } = decoded;

    // 2. Lookup session in repository
    const session = repository.findConsentSessionByJti(jti, guestId);
    if (!session) {
      throw new Error('Consent session not found.');
    }

    // 3. Anti-Replay check: If session or JTI was already consumed, BLOCK and AUDIT
    if (session.status === 'consumed') {
      await repository.addAuditLog({
        session_id,
        patient_id,
        doctor_id: doctorId,
        action: 'TOKEN_REPLAY_BLOCKED',
        metadata: { jti, attempt_time: new Date().toISOString() }
      }, guestId);

      const replayErr = new Error('Security Alert: Replay detected. This single-use QR token has already been consumed.');
      replayErr.statusCode = 401;
      replayErr.code = 'TOKEN_REPLAY_BLOCKED';
      throw replayErr;
    }

    if (session.status === 'revoked') {
      const revokedErr = new Error('Access denied: This patient consent session has been revoked.');
      revokedErr.statusCode = 403;
      revokedErr.code = 'SESSION_REVOKED';
      throw revokedErr;
    }

    if (new Date(session.expires_at) < new Date()) {
      session.status = 'expired';
      await repository.updateConsentSession(session_id, { status: 'expired' }, guestId);
      throw new Error('This QR code has expired. Please ask the patient to refresh.');
    }

    // 4. Mark token consumed and bind doctor
    const nowIso = new Date().toISOString();
    await repository.updateConsentSession(session_id, {
      status: 'consumed',
      doctor_id: doctorId,
      consumed_at: nowIso
    }, guestId);

    // 5. Retrieve patient profile and filter records by granted scopes
    const patient = repository.findUserById(patient_id, guestId);
    if (!patient) {
      throw new Error('Patient record not found.');
    }

    const allRecords = repository.getRecordsByPatientId(patient_id, guestId);
    const filteredRecords = this._filterRecordsByScope(allRecords, scopes);

    // 6. Record audit log
    const loadTimeMs = Date.now() - startTime;
    const auditEntry = await repository.addAuditLog({
      session_id,
      patient_id,
      doctor_id: doctorId,
      action: 'QR_SCANNED',
      metadata: {
        scopes,
        record_count: filteredRecords.length,
        load_time_ms: loadTimeMs
      }
    }, guestId);

    // 7. Notify patient via WebSocket that session was consumed
    wsHub.broadcastToPatient(patient_id, 'SESSION_CONSUMED', {
      session_id,
      doctor_id: doctorId,
      timestamp: nowIso
    });
    wsHub.broadcastToPatient(patient_id, 'AUDIT_EVENT', auditEntry);

    return {
      session_id,
      patient: {
        user_id: patient.user_id,
        name: patient.name,
        phone_number: patient.phone_number,
        abha_id: patient.abha_id,
        avatar_url: patient.avatar_url,
        language_pref: patient.language_pref,
        emergency_contact_phone: patient.emergency_contact_phone
      },
      scopes,
      records: filteredRecords,
      load_time_ms: loadTimeMs,
      expires_at: session.expires_at
    };
  }

  /**
   * Filters medical records based on consent scopes
   */
  _filterRecordsByScope(records, scopes) {
    if (!scopes || scopes.includes('full_history')) {
      return records;
    }
    const scopeMap = {
      allergies: ['Allergy', 'BloodGroup'],
      prescriptions: ['Prescription'],
      lab_reports: ['Lab Report'],
      vitals: ['Vitals', 'Diagnosis']
    };

    const allowedTypes = new Set();
    for (const scope of scopes) {
      const mapped = scopeMap[scope] || [];
      mapped.forEach(t => allowedTypes.add(t));
    }

    return records.filter(r => allowedTypes.has(r.record_type));
  }

  /**
   * Live Revocation Kill-Switch: Immediately invalidates session and signals doctor via WebSocket
   */
  async revokeSession(sessionId, patientId, guestId = null) {
    const session = repository.findConsentSessionById(sessionId, guestId);
    if (!session) {
      throw new Error('Session not found.');
    }

    const nowIso = new Date().toISOString();
    await repository.updateConsentSession(sessionId, {
      status: 'revoked',
      revoked_at: nowIso
    }, guestId);

    const auditEntry = await repository.addAuditLog({
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: session.doctor_id,
      action: 'ACCESS_REVOKED',
      metadata: { reason: 'PATIENT_KILL_SWITCH' }
    }, guestId);

    // Broadcast instant revocation event over WebSocket to blank doctor screen
    wsHub.broadcastToSession(sessionId, 'SESSION_REVOKED', {
      session_id: sessionId,
      revoked_at: nowIso,
      message: 'Access has been revoked by the patient.'
    });

    if (session.doctor_id) {
      wsHub.broadcastToDoctor(session.doctor_id, 'SESSION_REVOKED', {
        session_id: sessionId,
        revoked_at: nowIso
      });
    }

    wsHub.broadcastToPatient(patientId, 'AUDIT_EVENT', auditEntry);

    return {
      success: true,
      session_id: sessionId,
      revoked_at: nowIso
    };
  }
}

export const consentService = new ConsentService();
export default consentService;
