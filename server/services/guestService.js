/**
 * @file server/services/guestService.js
 * @description Guest Mode sandbox lifecycle manager ensuring demo isolation,
 * sample data provision, and complete session cleanup upon exit.
 */

import crypto from 'crypto';
import repository from '../db/repository.js';
import { TokenService } from './tokenService.js';

class GuestService {
  /**
   * Initializes a new guest patient sandbox and issues a guest JWT
   */
  startGuestPatient() {
    const guestId = `guest-p-${crypto.randomUUID()}`;
    const sandbox = repository.createGuestSandbox('guest_patient', guestId);
    const { accessToken } = TokenService.generateGuestToken('guest_patient', guestId);

    return {
      user: sandbox.patient,
      token: accessToken,
      guest_id: guestId,
      expires_in: 7200, // 2 hours
      mode: 'guest'
    };
  }

  /**
   * Initializes a new guest doctor sandbox and issues a guest JWT
   */
  startGuestDoctor() {
    const guestId = `guest-d-${crypto.randomUUID()}`;
    const sandbox = repository.createGuestSandbox('guest_doctor', guestId);
    const { accessToken } = TokenService.generateGuestToken('guest_doctor', guestId);

    return {
      doctor: {
        ...sandbox.doctor,
        license_id: sandbox.doctorProfile.license_id,
        clinic_name: sandbox.doctorProfile.clinic_name,
        clinic_city: sandbox.doctorProfile.clinic_city,
        specialization: sandbox.doctorProfile.specialization
      },
      token: accessToken,
      guest_id: guestId,
      expires_in: 7200,
      mode: 'guest'
    };
  }

  /**
   * Cleans up and destroys guest sandbox upon exit
   */
  exitGuest(guestId) {
    if (guestId) {
      repository.deleteGuestSandbox(guestId);
    }
    return { success: true, message: 'Guest session wiped successfully.' };
  }
}

export const guestService = new GuestService();
export default guestService;
