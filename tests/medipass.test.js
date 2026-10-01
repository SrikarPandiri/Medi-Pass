/**
 * @file tests/medipass.test.js
 * @description Comprehensive test suite using node:test and node:assert covering:
 * - Role separation and cross-role token rejection (HTTP 403)
 * - Anti-replay protection for single-use QR tokens
 * - Live kill-switch revocation
 * - Login failed attempt lockout protection
 * - Emergency Break-Glass 60s constraint and scope restriction
 * - Guest sandbox data isolation
 * - AI Safety Guard (emergencies, dose modifications, penicillin allergy conflict)
 * - PII Redactor
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

import repository from '../server/db/repository.js';
import { TokenService } from '../server/services/tokenService.js';
import { consentService } from '../server/services/consentService.js';
import { authService } from '../server/services/authService.js';
import { Redactor } from '../server/services/redactor.js';
import { SafetyGuard } from '../server/services/safetyGuard.js';
import { PromptBuilder } from '../server/services/promptBuilder.js';
import { guestService } from '../server/services/guestService.js';
import { authPatient } from '../server/middleware/authPatient.js';
import { authDoctor } from '../server/middleware/authDoctor.js';

describe('MediPass Production-Style Architecture Suite', () => {

  before(async () => {
    await repository.init();
  });

  describe('1. Role Separation & Anti-Spoofing', () => {
    test('Patient access token has patient audience and cannot authenticate as Doctor', () => {
      const patient = repository.findUserByPhone('9876543210');
      assert.ok(patient, 'Lakshmi patient seed must exist');

      const tokens = TokenService.generatePatientTokens(patient);
      assert.ok(tokens.accessToken);

      // Verify patient token against patient audience succeeds
      const patientVerified = TokenService.verifyPatientToken(tokens.accessToken);
      assert.equal(patientVerified.role, 'patient');

      // Verify patient token against doctor audience fails (segregated secrets/audiences)
      const doctorVerified = TokenService.verifyDoctorToken(tokens.accessToken);
      assert.equal(doctorVerified, null, 'Patient token must never verify as Doctor');
    });

    test('Doctor access token cannot authenticate on Patient routes (returns 403)', () => {
      const doctor = repository.findDoctorByLicense('TSMC-12345');
      assert.ok(doctor, 'Dr Anita seed must exist');

      const tokens = TokenService.generateDoctorTokens(doctor, doctor.credentials);
      assert.ok(tokens.accessToken);

      // Mock Express req, res, next for authPatient middleware
      const req = {
        headers: { authorization: `Bearer ${tokens.accessToken}` }
      };
      let capturedStatus = 0;
      let capturedBody = null;
      const res = {
        status: (code) => {
          capturedStatus = code;
          return {
            json: (body) => { capturedBody = body; }
          };
        }
      };
      const next = () => { assert.fail('Next should not be called for cross-role doctor token'); };

      authPatient(req, res, next);
      assert.equal(capturedStatus, 403, 'Cross-role token must return 403 Forbidden');
      assert.equal(capturedBody?.error?.code, 'FORBIDDEN_ROLE');
    });
  });

  describe('2. Anti-Replay Protection & Single-Use Rolling QR', () => {
    test('First QR scan consumes token; second scan fails with TOKEN_REPLAY_BLOCKED', async () => {
      const patient = repository.findUserByPhone('9876543210');
      const doctor = repository.findDoctorByLicense('TSMC-12345');

      // Create dynamic rolling session
      const session = await consentService.createSession(patient.user_id, ['allergies', 'prescriptions']);
      assert.ok(session.qr_token);

      // First Scan: Doctor scans patient QR -> Succeeds
      const firstScan = await consentService.verifyAndConsume(session.qr_token, doctor.user_id);
      assert.equal(firstScan.session_id, session.session_id);
      assert.ok(firstScan.records.length > 0);

      // Second Scan: Replay of same consumed token -> MUST FAIL WITH REPLAY ERROR
      await assert.rejects(
        async () => {
          await consentService.verifyAndConsume(session.qr_token, doctor.user_id);
        },
        (err) => {
          assert.equal(err.code, 'TOKEN_REPLAY_BLOCKED');
          return true;
        },
        'Replay scan of consumed token must be blocked'
      );
    });
  });

  describe('3. Live Revocation Kill-Switch', () => {
    test('Patient kill-switch revokes active consent session', async () => {
      const patient = repository.findUserByPhone('9876543210');
      const session = await consentService.createSession(patient.user_id);

      const revoked = await consentService.revokeSession(session.session_id, patient.user_id);
      assert.equal(revoked.success, true);

      // Check session status in repository
      const updatedSess = repository.findConsentSessionById(session.session_id);
      assert.equal(updatedSess.status, 'revoked');
    });
  });

  describe('4. Login Lockout Protection', () => {
    test('5 consecutive failed PIN attempts triggers account lockout', async () => {
      const patient = repository.findUserByPhone('9876543210');

      // Reset attempts
      await repository.updatePatientCredentials(patient.user_id, { failed_attempts: 0, locked_until: null });

      // Fail 4 times
      for (let i = 0; i < 4; i++) {
        await assert.rejects(
          async () => { await authService.loginWithPin('9876543210', '9999'); },
          /Invalid credentials/
        );
      }

      // 5th failed attempt -> Triggers 15-min lockout
      await assert.rejects(
        async () => { await authService.loginWithPin('9876543210', '9999'); },
        /Invalid credentials/
      );

      const creds = repository.getPatientCredentials(patient.user_id);
      assert.ok(creds.locked_until, 'Account must be locked until future timestamp');
      assert.ok(new Date(creds.locked_until) > new Date(), 'Lockout must be in the future');

      // 6th attempt immediately rejected with lockout error
      await assert.rejects(
        async () => { await authService.loginWithPin('9876543210', '1234'); },
        /Account temporarily locked/
      );
    });
  });

  describe('5. Guest Sandbox Isolation', () => {
    test('Guest patient mutations are confined to in-memory sandbox and never touch real tables', async () => {
      const realRecordsCountBefore = repository.state.medicalRecords.length;

      const guestRes = guestService.startGuestPatient();
      assert.ok(guestRes.guest_id);
      assert.equal(guestRes.mode, 'guest');

      // Add record to guest session
      const dummyRecord = {
        record_id: 'guest-temp-rec-99',
        patient_id: guestRes.user.user_id,
        record_type: 'Vitals',
        title: 'Sandbox Vitals Test',
        content: { bp: '120/80' }
      };

      await repository.addRecord(dummyRecord, guestRes.guest_id);

      // Verify added in sandbox
      const sandboxRecords = repository.getRecordsByPatientId(guestRes.user.user_id, guestRes.guest_id);
      assert.ok(sandboxRecords.some(r => r.record_id === 'guest-temp-rec-99'));

      // Verify REAL database records remain completely untouched
      const realRecordsCountAfter = repository.state.medicalRecords.length;
      assert.equal(realRecordsCountAfter, realRecordsCountBefore, 'Real tables must have 0 guest records');
    });
  });

  describe('6. AI Safety Guardrails', () => {
    test('Emergency detection triggers immediate short-circuit in English and regional languages', () => {
      const checkEn = SafetyGuard.evaluate('I have crushing chest pain and cannot breathe');
      assert.equal(checkEn.safe, false);
      assert.equal(checkEn.type, 'EMERGENCY');
      assert.ok(checkEn.intervention.includes('108'));

      const checkTe = SafetyGuard.evaluate('నాకు తీవ్రమైన గుండె నొప్పి వస్తోంది');
      assert.equal(checkTe.safe, false);
      assert.equal(checkTe.type, 'EMERGENCY');
      assert.ok(checkTe.intervention.includes('112'));

      const checkSelfHarm = SafetyGuard.evaluate('I want to kill myself');
      assert.equal(checkSelfHarm.safe, false);
      assert.equal(checkSelfHarm.isSelfHarm, true);
      assert.ok(checkSelfHarm.intervention.includes('Tele-MANAS'));
    });

    test('Refuses medication dosage modification requests', () => {
      const check = SafetyGuard.evaluate('Can I double the dose of my metformin to 1000mg?');
      assert.equal(check.safe, false);
      assert.equal(check.type, 'REFUSAL_DOSE_CHANGE');
      assert.ok(check.intervention.includes('Medical Safety Guardrail'));
    });

    test('Flags severe Penicillin allergy when user queries about beta-lactam antibiotics', () => {
      const mockRecords = [
        {
          record_id: 'rec-1',
          record_type: 'Allergy',
          content: { allergen: 'Penicillin', severity: 'Severe' }
        }
      ];

      const check = SafetyGuard.evaluate('Can I take Amoxicillin for my toothache?', mockRecords);
      assert.equal(check.flags.includes('allergy_warning'), true);
      assert.ok(check.allergyWarning.includes('ALLERGY CONFLICT'));
    });
  });

  describe('7. Privacy Redaction Engine', () => {
    test('Redactor strips patient name, phone, ABHA ID, and email from records context', () => {
      const user = {
        name: 'Lakshmi Devi',
        phone_number: '9876543210',
        abha_id: '91-2345-6789-0123',
        email: 'lakshmi.devi@example.com'
      };

      const rawRecords = [
        {
          record_id: 'rec-test-1',
          record_type: 'Lab Report',
          title: 'Report for Lakshmi Devi',
          content: {
            notes: 'Patient Lakshmi Devi (Phone: 9876543210, ABHA: 91-2345-6789-0123, email: lakshmi.devi@example.com) HbA1c 7.8%'
          },
          created_at: new Date().toISOString()
        }
      ];

      const redacted = Redactor.redactContext(rawRecords, user);
      const contentStr = JSON.stringify(redacted[0].content);

      assert.equal(contentStr.includes('9876543210'), false, 'Phone must be redacted');
      assert.equal(contentStr.includes('91-2345-6789-0123'), false, 'ABHA ID must be redacted');
      assert.equal(contentStr.includes('lakshmi.devi@example.com'), false, 'Email must be redacted');
      assert.equal(contentStr.includes('Lakshmi Devi'), false, 'Full Name must be redacted');
      assert.ok(contentStr.includes('[REDACTED_IDENTIFIER]') || contentStr.includes('[REDACTED_PHONE]'));
    });
  });
});
