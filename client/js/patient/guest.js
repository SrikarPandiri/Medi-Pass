/**
 * @file client/js/patient/guest.js
 * @description Patient Guest mode helper utilities.
 */

import { Api } from '../shared/api.js';

export class PatientGuest {
  static isGuest() {
    return localStorage.getItem('medipass_is_guest') === 'true';
  }

  static async exit() {
    try {
      await Api.post('/api/auth/guest/exit', {});
    } catch (e) {}
    Api.clearTokens();
    window.location.href = '/patient/login.html';
  }
}

export default PatientGuest;
