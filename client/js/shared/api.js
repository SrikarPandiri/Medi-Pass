/**
 * @file client/js/shared/api.js
 * @description Centralized HTTP fetch client with automated JWT Bearer injection,
 * refresh token rotation, guest mode authorization handling, and unified error parsing.
 */

export class Api {
  static getAuthToken() {
    const isDoctorApp = window.location.pathname.includes('/doctor');
    const key = isDoctorApp ? 'medipass_doctor_token' : 'medipass_patient_token';
    return localStorage.getItem(key) || localStorage.getItem('medipass_guest_token');
  }

  static getRefreshToken() {
    const isDoctorApp = window.location.pathname.includes('/doctor');
    const key = isDoctorApp ? 'medipass_doctor_refresh' : 'medipass_patient_refresh';
    return localStorage.getItem(key);
  }

  static setTokens({ accessToken, refreshToken, isDoctor = false, isGuest = false }) {
    if (isGuest) {
      localStorage.setItem('medipass_guest_token', accessToken);
      localStorage.setItem('medipass_is_guest', 'true');
      return;
    }

    const tokenKey = isDoctor ? 'medipass_doctor_token' : 'medipass_patient_token';
    const refreshKey = isDoctor ? 'medipass_doctor_refresh' : 'medipass_patient_refresh';

    localStorage.setItem(tokenKey, accessToken);
    if (refreshToken) {
      localStorage.setItem(refreshKey, refreshToken);
    }
    localStorage.removeItem('medipass_is_guest');
    localStorage.removeItem('medipass_guest_token');
  }

  static clearTokens() {
    localStorage.removeItem('medipass_patient_token');
    localStorage.removeItem('medipass_patient_refresh');
    localStorage.removeItem('medipass_doctor_token');
    localStorage.removeItem('medipass_doctor_refresh');
    localStorage.removeItem('medipass_guest_token');
    localStorage.removeItem('medipass_is_guest');
  }

  static async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    // If body is FormData (e.g. OCR image upload), remove Content-Type to let browser set boundary
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let response = await fetch(url, { ...options, headers });

      // Handle 401 & attempt refresh
      if (response.status === 401 && !url.includes('/refresh') && !url.includes('/login') && !url.includes('/otp')) {
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
          const isDoctorApp = window.location.pathname.includes('/doctor');
          const refreshUrl = isDoctorApp ? '/api/auth/doctor/refresh' : '/api/auth/patient/refresh';

          const refRes = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });

          if (refRes.ok) {
            const data = await refRes.json();
            this.setTokens({
              accessToken: data.tokens.accessToken,
              refreshToken: data.tokens.refreshToken,
              isDoctor: isDoctorApp
            });
            // Retry initial request with new token
            headers['Authorization'] = `Bearer ${data.tokens.accessToken}`;
            response = await fetch(url, { ...options, headers });
          } else {
            this.clearTokens();
          }
        }
      }

      const contentType = response.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errMessage = data?.error?.message || (typeof data === 'string' ? data : 'API Request Failed');
        const err = new Error(errMessage);
        err.status = response.status;
        err.code = data?.error?.code || 'API_ERROR';
        throw err;
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  static get(url) {
    return this.request(url, { method: 'GET' });
  }

  static post(url, body) {
    const isFormData = body instanceof FormData;
    return this.request(url, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  }

  static patch(url, body) {
    return this.request(url, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  static delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
}

export default Api;
