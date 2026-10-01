/**
 * @file server/routes/authDoctor.js
 * @description Doctor authentication endpoints: license/password login,
 * practitioner registration, token refresh, and session revocation.
 */

import { Router } from 'express';
import { authService } from '../services/authService.js';
import { TokenService } from '../services/tokenService.js';
import repository from '../db/repository.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * Doctor Registration
 */
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, license_id, clinic_name, clinic_city, specialization, phone, password } = req.body;
    if (!name || !license_id || !clinic_name || !password) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'Name, license ID, clinic name, and password are required.' }
      });
    }

    const result = await authService.registerDoctor({
      name,
      license_id,
      clinic_name,
      clinic_city: clinic_city || 'City',
      specialization: specialization || 'General Practice',
      phone,
      password
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Doctor Login via License & Password
 */
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { license_id, password } = req.body;
    if (!license_id || !password) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'Medical license ID and password are required.' }
      });
    }

    const result = await authService.loginDoctor(license_id, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Doctor Token Refresh
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: { code: 'MISSING_TOKEN', message: 'Refresh token required.' } });
    }

    const decoded = TokenService.verifyDoctorToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired doctor refresh token.' } });
    }

    const session = repository.findAuthSession(decoded.auth_session_id);
    if (!session || session.revoked) {
      return res.status(401).json({ error: { code: 'SESSION_REVOKED', message: 'Session revoked. Please log in again.' } });
    }

    const user = repository.findUserById(decoded.sub);
    const creds = repository.getDoctorCredentials(decoded.sub);
    if (!user || !creds) {
      return res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: 'Doctor record not found.' } });
    }

    const tokens = TokenService.generateDoctorTokens(user, creds, session.auth_session_id);
    res.json({ tokens });
  } catch (err) {
    next(err);
  }
});

/**
 * Logout
 */
router.post('/logout', async (req, res, next) => {
  try {
    const { authSessionId } = req.body;
    if (authSessionId) {
      await repository.revokeAuthSession(authSessionId);
    }
    res.json({ success: true, message: 'Doctor session ended successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * Logout All
 */
router.post('/logout-all', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (userId) {
      await repository.revokeAllUserSessions(userId);
    }
    res.json({ success: true, message: 'Logged out of all doctor terminals.' });
  } catch (err) {
    next(err);
  }
});

export default router;
