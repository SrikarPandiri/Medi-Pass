/**
 * @file server/routes/authGuest.js
 * @description Guest authentication endpoints for instant friction-free evaluations.
 * Creates temporary in-memory sandboxes for guest patients and doctors.
 */

import { Router } from 'express';
import { guestService } from '../services/guestService.js';
import { authGuest } from '../middleware/authGuest.js';

const router = Router();

/**
 * Start Guest Patient Session
 */
router.post('/patient', (req, res, next) => {
  try {
    const result = guestService.startGuestPatient();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Start Guest Doctor Session
 */
router.post('/doctor', (req, res, next) => {
  try {
    const result = guestService.startGuestDoctor();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Exit and destroy active guest session sandbox
 */
router.post('/exit', authGuest, (req, res, next) => {
  try {
    const result = guestService.exitGuest(req.guestId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
