/**
 * @file server/services/authService.js
 * @description Authentication service managing OTP lifecycles, PIN validation,
 * doctor license verification, lockout protection, and credential issuance.
 */

import crypto from 'crypto';
import repository from '../db/repository.js';
import { TokenService } from './tokenService.js';
import { CryptoService } from './cryptoService.js';
import { smsService } from './smsService.js';

class AuthService {
  constructor() {
    // In-memory OTP storage: phone -> { otp, expiresAt, attempts }
    this.otpStore = new Map();
  }

  /**
   * Requests a 6-digit OTP for a phone number
   */
  async requestOtp(phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      throw new Error('Invalid phone number. Must be 10 digits.');
    }

    const otp = CryptoService.generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    this.otpStore.set(cleanPhone, {
      otp,
      expiresAt,
      attempts: 0
    });

    const smsBody = `Your MediPass verification code is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`;
    await smsService.sendSms(`+91${cleanPhone}`, smsBody, 'OTP');

    return {
      success: true,
      phone: cleanPhone,
      expiresIn: 300,
      devOtp: otp // Returned for demo banner convenience
    };
  }

  /**
   * Verifies an OTP and authenticates or signals new user registration
   */
  async verifyOtp(phone, inputOtp) {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    const entry = this.otpStore.get(cleanPhone);

    if (!entry) {
      throw new Error('No OTP requested for this phone number or OTP has expired.');
    }

    if (Date.now() > entry.expiresAt) {
      this.otpStore.delete(cleanPhone);
      throw new Error('OTP has expired. Please request a new code.');
    }

    entry.attempts += 1;
    if (entry.attempts > 3) {
      this.otpStore.delete(cleanPhone);
      throw new Error('Too many failed OTP attempts. Please request a new OTP.');
    }

    if (entry.otp !== inputOtp.trim()) {
      throw new Error(`Invalid OTP code. Attempts remaining: ${3 - entry.attempts}`);
    }

    // OTP verified successfully
    this.otpStore.delete(cleanPhone);

    const user = repository.findUserByPhone(cleanPhone);
    if (!user) {
      return {
        isNewUser: true,
        phone: cleanPhone
      };
    }

    if (user.role !== 'patient') {
      throw new Error('This phone number is not registered as a patient.');
    }

    // Create session and issue tokens
    const authSessionId = crypto.randomUUID();
    const tokens = TokenService.generatePatientTokens(user, authSessionId);

    await repository.createAuthSession({
      auth_session_id: authSessionId,
      user_id: user.user_id,
      role: 'patient',
      refresh_token_hash: TokenService.hashToken(tokens.refreshToken),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      revoked: false
    });

    await repository.addAuditLog({
      patient_id: user.user_id,
      action: 'PATIENT_LOGIN',
      metadata: { method: 'OTP' }
    });

    return {
      isNewUser: false,
      user: {
        user_id: user.user_id,
        name: user.name,
        role: user.role,
        phone_number: user.phone_number,
        email: user.email,
        abha_id: user.abha_id,
        avatar_url: user.avatar_url,
        language_pref: user.language_pref,
        ai_consent: user.ai_consent
      },
      tokens
    };
  }

  /**
   * Authenticates a patient via PIN
   */
  async loginWithPin(phone, pin) {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    const user = repository.findUserByPhone(cleanPhone);

    if (!user || user.role !== 'patient') {
      throw new Error('Invalid credentials');
    }

    const creds = repository.getPatientCredentials(user.user_id);
    if (!creds || !creds.pin_hash) {
      throw new Error('No PIN set for this account. Please log in with OTP.');
    }

    // Check lockout
    if (creds.locked_until && new Date(creds.locked_until) > new Date()) {
      const waitMin = Math.ceil((new Date(creds.locked_until).getTime() - Date.now()) / 60000);
      throw new Error(`Account temporarily locked due to failed attempts. Try again in ${waitMin} minutes.`);
    }

    const isValid = await CryptoService.compare(pin, creds.pin_hash);
    if (!isValid) {
      const attempts = (creds.failed_attempts || 0) + 1;
      const updates = { failed_attempts: attempts };

      if (attempts >= 5) {
        updates.locked_until = new Date(Date.now() + 15 * 60000).toISOString();
        updates.failed_attempts = 0;
      }
      await repository.updatePatientCredentials(user.user_id, updates);
      throw new Error('Invalid credentials');
    }

    // Reset attempts on success
    await repository.updatePatientCredentials(user.user_id, {
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString()
    });

    const authSessionId = crypto.randomUUID();
    const tokens = TokenService.generatePatientTokens(user, authSessionId);

    await repository.createAuthSession({
      auth_session_id: authSessionId,
      user_id: user.user_id,
      role: 'patient',
      refresh_token_hash: TokenService.hashToken(tokens.refreshToken),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      revoked: false
    });

    await repository.addAuditLog({
      patient_id: user.user_id,
      action: 'PATIENT_LOGIN',
      metadata: { method: 'PIN' }
    });

    return {
      user: {
        user_id: user.user_id,
        name: user.name,
        role: user.role,
        phone_number: user.phone_number,
        email: user.email,
        abha_id: user.abha_id,
        avatar_url: user.avatar_url,
        language_pref: user.language_pref,
        ai_consent: user.ai_consent
      },
      tokens
    };
  }

  /**
   * Registers a new patient after OTP verification
   */
  async signupPatient({ name, phone, abha_id, language_pref = 'en', emergency_contact_phone, pin }) {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    const existing = repository.findUserByPhone(cleanPhone);
    if (existing) {
      throw new Error('A user with this mobile number already exists.');
    }

    const userId = `p-${crypto.randomUUID()}`;
    const user = {
      user_id: userId,
      name: name.trim(),
      role: 'patient',
      phone_number: cleanPhone,
      email: `${cleanPhone}@patient.medipass.local`,
      abha_id: abha_id ? abha_id.trim() : null,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      language_pref: ['en', 'hi', 'te', 'ta', 'kn'].includes(language_pref) ? language_pref : 'en',
      emergency_contact_phone: emergency_contact_phone || null,
      ai_consent: false,
      is_guest: false,
      created_at: new Date().toISOString()
    };

    let credentials = null;
    if (pin) {
      const pinHash = await CryptoService.hash(pin);
      credentials = {
        pin_hash: pinHash,
        failed_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString()
      };
    }

    await repository.createUser(user, credentials);

    const authSessionId = crypto.randomUUID();
    const tokens = TokenService.generatePatientTokens(user, authSessionId);

    await repository.createAuthSession({
      auth_session_id: authSessionId,
      user_id: user.user_id,
      role: 'patient',
      refresh_token_hash: TokenService.hashToken(tokens.refreshToken),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      revoked: false
    });

    await repository.addAuditLog({
      patient_id: user.user_id,
      action: 'PATIENT_LOGIN',
      metadata: { method: 'SIGNUP' }
    });

    return { user, tokens };
  }

  /**
   * Authenticates doctor via license ID and password
   */
  async loginDoctor(licenseId, password) {
    const doctorData = repository.findDoctorByLicense(licenseId);
    if (!doctorData || !doctorData.credentials) {
      throw new Error('Invalid credentials');
    }

    const creds = doctorData.credentials;

    // Check lockout
    if (creds.locked_until && new Date(creds.locked_until) > new Date()) {
      const waitMin = Math.ceil((new Date(creds.locked_until).getTime() - Date.now()) / 60000);
      throw new Error(`Account temporarily locked due to failed attempts. Try again in ${waitMin} minutes.`);
    }

    const isValid = await CryptoService.compare(password, creds.password_hash);
    if (!isValid) {
      const attempts = (creds.failed_attempts || 0) + 1;
      const updates = { failed_attempts: attempts };

      if (attempts >= 5) {
        updates.locked_until = new Date(Date.now() + 15 * 60000).toISOString();
        updates.failed_attempts = 0;
      }
      await repository.updateDoctorCredentials(doctorData.user_id, updates);
      throw new Error('Invalid credentials');
    }

    // Reset attempts on success
    await repository.updateDoctorCredentials(doctorData.user_id, {
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString()
    });

    const authSessionId = crypto.randomUUID();
    const tokens = TokenService.generateDoctorTokens(doctorData, creds, authSessionId);

    await repository.createAuthSession({
      auth_session_id: authSessionId,
      user_id: doctorData.user_id,
      role: 'doctor',
      refresh_token_hash: TokenService.hashToken(tokens.refreshToken),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      revoked: false
    });

    await repository.addAuditLog({
      doctor_id: doctorData.user_id,
      clinic_name: creds.clinic_name,
      action: 'DOCTOR_LOGIN',
      metadata: { license_id: creds.license_id }
    });

    return {
      doctor: {
        user_id: doctorData.user_id,
        name: doctorData.name,
        role: doctorData.role,
        license_id: creds.license_id,
        clinic_name: creds.clinic_name,
        clinic_city: creds.clinic_city,
        specialization: creds.specialization,
        avatar_url: doctorData.avatar_url
      },
      tokens
    };
  }

  /**
   * Registers a new doctor account
   */
  async registerDoctor({ name, license_id, clinic_name, clinic_city, specialization, phone, password }) {
    const existing = repository.findDoctorByLicense(license_id);
    if (existing) {
      throw new Error('A doctor with this Medical License ID is already registered.');
    }

    const userId = `d-${crypto.randomUUID()}`;
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '').slice(-10) : '';

    const user = {
      user_id: userId,
      name: name.trim(),
      role: 'doctor',
      phone_number: cleanPhone,
      email: `${license_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@clinic.medipass.local`,
      abha_id: `DOC-${license_id.toUpperCase()}`,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      language_pref: 'en',
      emergency_contact_phone: null,
      ai_consent: false,
      is_guest: false,
      created_at: new Date().toISOString()
    };

    const passwordHash = await CryptoService.hash(password);
    const credentials = {
      license_id: license_id.trim().toUpperCase(),
      password_hash: passwordHash,
      clinic_name: clinic_name.trim(),
      clinic_city: clinic_city.trim(),
      specialization: specialization.trim(),
      verification_status: 'verified', // Auto-verified for prototype demonstration
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString()
    };

    await repository.createUser(user, credentials);

    const authSessionId = crypto.randomUUID();
    const tokens = TokenService.generateDoctorTokens(user, credentials, authSessionId);

    await repository.createAuthSession({
      auth_session_id: authSessionId,
      user_id: user.user_id,
      role: 'doctor',
      refresh_token_hash: TokenService.hashToken(tokens.refreshToken),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      revoked: false
    });

    await repository.addAuditLog({
      doctor_id: user.user_id,
      clinic_name: credentials.clinic_name,
      action: 'DOCTOR_LOGIN',
      metadata: { license_id: credentials.license_id, method: 'REGISTRATION' }
    });

    return {
      doctor: {
        user_id: user.user_id,
        name: user.name,
        role: user.role,
        license_id: credentials.license_id,
        clinic_name: credentials.clinic_name,
        clinic_city: credentials.clinic_city,
        specialization: credentials.specialization,
        avatar_url: user.avatar_url
      },
      tokens
    };
  }
}

export const authService = new AuthService();
export default authService;
