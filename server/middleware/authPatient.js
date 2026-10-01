/**
 * @file server/middleware/authPatient.js
 * @description Authentication middleware for patient-facing endpoints.
 * Enforces audience isolation ('medipass-patient' or 'medipass-guest' with guest_patient role).
 * Rejects doctor tokens with 403.
 */

import { TokenService } from '../services/tokenService.js';
import repository from '../db/repository.js';

export function authPatient(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Missing Bearer token.' }
    });
  }

  const token = authHeader.split(' ')[1];

  // 1. Try Patient Access Token
  const patientData = TokenService.verifyPatientToken(token);
  if (patientData) {
    if (patientData.role !== 'patient') {
      return res.status(403).json({
        error: { code: 'FORBIDDEN_ROLE', message: 'Doctor credentials cannot access patient endpoints.' }
      });
    }

    const user = repository.findUserById(patientData.sub);
    if (!user) {
      return res.status(401).json({
        error: { code: 'USER_NOT_FOUND', message: 'Patient account does not exist.' }
      });
    }

    req.user = user;
    req.isGuest = false;
    req.guestId = null;
    return next();
  }

  // 2. Try Guest Patient Token
  const guestData = TokenService.verifyGuestToken(token);
  if (guestData) {
    if (guestData.role !== 'guest_patient') {
      return res.status(403).json({
        error: { code: 'FORBIDDEN_ROLE', message: 'Guest doctor token cannot access patient endpoints.' }
      });
    }

    const sb = repository.getGuestSandbox(guestData.guest_id);
    if (!sb) {
      return res.status(401).json({
        error: { code: 'GUEST_EXPIRED', message: 'Guest session expired or invalid.' }
      });
    }

    req.user = sb.patient;
    req.isGuest = true;
    req.guestId = guestData.guest_id;
    return next();
  }

  // 3. Check if doctor token was erroneously passed
  const doctorCheck = TokenService.verifyDoctorToken(token);
  if (doctorCheck) {
    return res.status(403).json({
      error: { code: 'FORBIDDEN_ROLE', message: 'Cross-role access forbidden: Doctor tokens cannot access patient routes.' }
    });
  }

  return res.status(401).json({
    error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired.' }
  });
}

export default authPatient;
