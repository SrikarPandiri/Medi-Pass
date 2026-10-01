/**
 * @file server/routes/patient.js
 * @description Patient profile, personal health records, AI consent management,
 * and offline cryptographic key registration.
 */

import { Router } from 'express';
import { authPatient } from '../middleware/authPatient.js';
import repository from '../db/repository.js';
import { AuditService } from '../services/auditService.js';

const router = Router();

// Protect all routes with authPatient
router.use(authPatient);

/**
 * Get current patient profile
 */
router.get('/me', (req, res) => {
  res.json({
    user: req.user,
    isGuest: req.isGuest
  });
});

/**
 * Get patient's medical records
 */
router.get('/records', (req, res, next) => {
  try {
    const records = repository.getRecordsByPatientId(req.user.user_id, req.guestId);
    res.json({ records });
  } catch (err) {
    next(err);
  }
});

/**
 * Register public key for offline ECDSA verification
 */
router.post('/offline-key', async (req, res, next) => {
  try {
    const { publicKeyJwk } = req.body;
    if (!publicKeyJwk) {
      return res.status(400).json({ error: { code: 'MISSING_KEY', message: 'Public key JWK is required.' } });
    }

    await repository.updateUser(req.user.user_id, {
      offline_public_key: publicKeyJwk
    }, req.guestId);

    await AuditService.log('OFFLINE_KEY_REGISTERED', {
      patient_id: req.user.user_id,
      metadata: { key_type: publicKeyJwk.kty || 'EC' }
    }, req.guestId);

    res.json({ success: true, message: 'Offline signing key registered successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * Get audit logs for patient
 */
router.get('/audit', (req, res, next) => {
  try {
    const logs = AuditService.getAuditTrail(req.user.user_id, req.guestId);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

/**
 * Grant or Revoke AI consent
 */
router.post('/ai-consent', async (req, res, next) => {
  try {
    const { consent } = req.body;
    const aiConsent = Boolean(consent);

    await repository.updateUser(req.user.user_id, { ai_consent: aiConsent }, req.guestId);

    await AuditService.log(
      aiConsent ? 'AI_CONSENT_GRANTED' : 'AI_CONSENT_REVOKED',
      {
        patient_id: req.user.user_id,
        metadata: { client: 'Patient Portal' }
      },
      req.guestId
    );

    res.json({
      success: true,
      ai_consent: aiConsent,
      message: aiConsent ? 'MediPass AI assistant granted access to medical records.' : 'AI assistant access revoked.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
