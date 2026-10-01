/**
 * @file client/js/doctor/guest.js
 * @description Doctor Guest mode helper utilities.
 */

import { Api } from '../shared/api.js';

export class DoctorGuest {
  static isGuest() {
    return localStorage.getItem('medipass_is_guest') === 'true';
  }

  static async exit() {
    try {
      await Api.post('/api/auth/guest/exit', {});
    } catch (e) {}
    Api.clearTokens();
    window.location.href = '/doctor/login.html';
  }
}

export default DoctorGuest;
