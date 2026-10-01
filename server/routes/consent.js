/**
 * @file server/routes/consent.js
 * @description Consent session routes: rolling QR token creation, rotation, and live kill-switch revocation.
 */

import { Router } from 'express';
import { authPatient } from '../middleware/authPatient.js';
import { consentService } from '../services/consentService.js';

const router = Router();

// Protect all consent routes with authPatient
router.use(authPatient);

/**
 * Create a new rolling consent QR session
 */
router.post('/session', async (req, res, next) => {
  try {
    const { scopes } = req.body;
    const sessionData = await consentService.createSession(
      req.user.user_id,
      scopes || ['allergies', 'prescriptions', 'lab_reports', 'vitals'],
      req.guestId
    );
    res.json(sessionData);
  } catch (err) {
    next(err);
  }
});

/**
 * Rotate QR token for an existing session (45-second cycle)
 */
router.post('/rotate', async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const sessionData = await consentService.rotateToken(sessionId, req.user.user_id, req.guestId);
    res.json(sessionData);
  } catch (err) {
    next(err);
  }
});

/**
 * Live Kill-Switch Revocation
 */
router.post('/revoke', async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: { code: 'MISSING_SESSION_ID', message: 'Session ID is required.' } });
    }

    const result = await consentService.revokeSession(sessionId, req.user.user_id, req.guestId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
