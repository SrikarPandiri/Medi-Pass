/**
 * @file server/routes/authPatient.js
 * @description Patient authentication endpoints: OTP request/verify, PIN login,
 * sign-up, token refresh, and session revocation.
 */

import { Router } from 'express';
import { authService } from '../services/authService.js';
import { TokenService } from '../services/tokenService.js';
import repository from '../db/repository.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * Request OTP
 */
router.post('/otp/request', otpLimiter, async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: { code: 'MISSING_PHONE', message: 'Phone number is required.' } });
    }
    const result = await authService.requestOtp(phone);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Verify OTP
 */
router.post('/otp/verify', authLimiter, async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Phone number and OTP code are required.' } });
    }
    const result = await authService.verifyOtp(phone, otp);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * PIN-based Login
 */
router.post('/pin-login', authLimiter, async (req, res, next) => {
  try {
    const { phone, pin } = req.body;
    if (!phone || !pin) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Phone number and PIN are required.' } });
    }
    const result = await authService.loginWithPin(phone, pin);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Patient Sign-up
 */
router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const { name, phone, abha_id, language_pref, emergency_contact_phone, pin } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Full name and phone number are required.' } });
    }
    const result = await authService.signupPatient({
      name,
      phone,
      abha_id,
      language_pref,
      emergency_contact_phone,
      pin
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Refresh Patient Access Token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: { code: 'MISSING_TOKEN', message: 'Refresh token required.' } });
    }

    const decoded = TokenService.verifyPatientToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token.' } });
    }

    const session = repository.findAuthSession(decoded.auth_session_id);
    if (!session || session.revoked) {
      return res.status(401).json({ error: { code: 'SESSION_REVOKED', message: 'Session revoked. Please log in again.' } });
    }

    const user = repository.findUserById(decoded.sub);
    if (!user) {
      return res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    }

    const tokens = TokenService.generatePatientTokens(user, session.auth_session_id);
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
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * Logout of All Devices
 */
router.post('/logout-all', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (userId) {
      await repository.revokeAllUserSessions(userId);
    }
    res.json({ success: true, message: 'Logged out of all devices.' });
  } catch (err) {
    next(err);
  }
});

export default router;
