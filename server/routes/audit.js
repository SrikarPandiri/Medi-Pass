/**
 * @file server/routes/audit.js
 * @description Dedicated audit inspection routes for patients and compliance review.
 */

import { Router } from 'express';
import { authPatient } from '../middleware/authPatient.js';
import repository from '../db/repository.js';

const router = Router();

/**
 * Get patient audit trail
 */
router.get('/patient', authPatient, (req, res, next) => {
  try {
    const logs = repository.getAuditLogsByPatientId(req.user.user_id, req.guestId);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

export default router;
