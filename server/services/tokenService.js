/**
 * @file server/services/tokenService.js
 * @description JWT token management with segregated secrets, distinct audiences, and replay protection.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config.js';

export class TokenService {
  /**
   * Generates patient authentication token pair
   */
  static generatePatientTokens(user, authSessionId = crypto.randomUUID()) {
    const payload = {
      sub: user.user_id,
      role: 'patient',
      auth_session_id: authSessionId,
      phone: user.phone_number
    };

    const accessToken = jwt.sign(payload, config.jwt.patientSecret, {
      audience: config.jwt.patientAudience,
      expiresIn: config.jwt.accessExpiry
    });

    const refreshToken = jwt.sign(
      { sub: user.user_id, auth_session_id: authSessionId, type: 'refresh' },
      config.jwt.patientSecret,
      {
        audience: config.jwt.patientAudience,
        expiresIn: config.jwt.refreshExpiry
      }
    );

    return { accessToken, refreshToken, authSessionId };
  }

  /**
   * Generates doctor authentication token pair
   */
  static generateDoctorTokens(user, doctorProfile, authSessionId = crypto.randomUUID()) {
    const payload = {
      sub: user.user_id,
      role: 'doctor',
      auth_session_id: authSessionId,
      license_id: doctorProfile.license_id,
      clinic: doctorProfile.clinic_name
    };

    const accessToken = jwt.sign(payload, config.jwt.doctorSecret, {
      audience: config.jwt.doctorAudience,
      expiresIn: config.jwt.accessExpiry
    });

    const refreshToken = jwt.sign(
      { sub: user.user_id, auth_session_id: authSessionId, type: 'refresh' },
      config.jwt.doctorSecret,
      {
        audience: config.jwt.doctorAudience,
        expiresIn: config.jwt.refreshExpiry
      }
    );

    return { accessToken, refreshToken, authSessionId };
  }

  /**
   * Generates isolated guest authentication token
   */
  static generateGuestToken(role, guestId, sandboxState = {}) {
    const payload = {
      sub: guestId,
      guest_id: guestId,
      role, // 'guest_patient' or 'guest_doctor'
      is_guest: true
    };

    const accessToken = jwt.sign(payload, config.jwt.guestSecret, {
      audience: config.jwt.guestAudience,
      expiresIn: config.jwt.guestExpiry
    });

    return { accessToken, guestId };
  }

  /**
   * Generates dynamic QR consent token with 45-second lifespan and unique JTI
   */
  static generateConsentToken(patientId, sessionId, scopes = ['allergies', 'prescriptions', 'lab_reports', 'vitals']) {
    const jti = crypto.randomUUID();
    const payload = {
      patient_id: patientId,
      session_id: sessionId,
      scopes,
      jti
    };

    const qrToken = jwt.sign(payload, config.jwt.consentSecret, {
      audience: config.jwt.consentAudience,
      expiresIn: config.jwt.qrExpirySeconds
    });

    return { qrToken, jti, expiresIn: config.jwt.qrExpirySeconds };
  }

  /**
   * Verifies a JWT against a specified secret and expected audience
   */
  static verifyToken(token, secret, expectedAudience) {
    try {
      return jwt.verify(token, secret, { audience: expectedAudience });
    } catch (err) {
      return null;
    }
  }

  /**
   * Verifies patient access token
   */
  static verifyPatientToken(token) {
    return this.verifyToken(token, config.jwt.patientSecret, config.jwt.patientAudience);
  }

  /**
   * Verifies doctor access token
   */
  static verifyDoctorToken(token) {
    return this.verifyToken(token, config.jwt.doctorSecret, config.jwt.doctorAudience);
  }

  /**
   * Verifies guest access token
   */
  static verifyGuestToken(token) {
    return this.verifyToken(token, config.jwt.guestSecret, config.jwt.guestAudience);
  }

  /**
   * Verifies dynamic QR consent token
   */
  static verifyConsentToken(token) {
    return this.verifyToken(token, config.jwt.consentSecret, config.jwt.consentAudience);
  }

  /**
   * Helper to hash refresh tokens before database storage
   */
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export default TokenService;
