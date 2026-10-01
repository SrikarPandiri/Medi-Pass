/**
 * @file server/middleware/authDoctor.js
 * @description Authentication middleware for doctor-facing endpoints.
 * Enforces audience isolation ('medipass-doctor' or 'medipass-guest' with guest_doctor role).
 * Rejects patient tokens with 403.
 */

import { TokenService } from '../services/tokenService.js';
import repository from '../db/repository.js';

export function authDoctor(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Missing Bearer token.' }
    });
  }

  const token = authHeader.split(' ')[1];

  // 1. Try Doctor Access Token
  const doctorData = TokenService.verifyDoctorToken(token);
  if (doctorData) {
    if (doctorData.role !== 'doctor') {
      return res.status(403).json({
        error: { code: 'FORBIDDEN_ROLE', message: 'Patient credentials cannot access doctor endpoints.' }
      });
    }

    const user = repository.findUserById(doctorData.sub);
    const creds = repository.getDoctorCredentials(doctorData.sub);
    if (!user || !creds) {
      return res.status(401).json({
        error: { code: 'USER_NOT_FOUND', message: 'Doctor account does not exist.' }
      });
    }

    req.doctor = { ...user, license_id: creds.license_id, clinic_name: creds.clinic_name, clinic_city: creds.clinic_city };
    req.isGuest = false;
    req.guestId = null;
    return next();
  }

  // 2. Try Guest Doctor Token
  const guestData = TokenService.verifyGuestToken(token);
  if (guestData) {
    if (guestData.role !== 'guest_doctor') {
      return res.status(403).json({
        error: { code: 'FORBIDDEN_ROLE', message: 'Guest patient tokens cannot access doctor endpoints.' }
      });
    }

    const sb = repository.getGuestSandbox(guestData.guest_id);
    if (!sb) {
      return res.status(401).json({
        error: { code: 'GUEST_EXPIRED', message: 'Guest session expired or invalid.' }
      });
    }

    req.doctor = {
      ...sb.doctor,
      license_id: sb.doctorProfile.license_id,
      clinic_name: sb.doctorProfile.clinic_name,
      clinic_city: sb.doctorProfile.clinic_city
    };
    req.isGuest = true;
    req.guestId = guestData.guest_id;
    return next();
  }

  // 3. Check if patient token was passed to doctor endpoint
  const patientCheck = TokenService.verifyPatientToken(token);
  if (patientCheck) {
    return res.status(403).json({
      error: { code: 'FORBIDDEN_ROLE', message: 'Cross-role access forbidden: Patient tokens cannot access clinical doctor routes.' }
    });
  }

  return res.status(401).json({
    error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired.' }
  });
}

export default authDoctor;
