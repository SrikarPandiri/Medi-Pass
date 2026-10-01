/**
 * @file client/js/doctor/auth.js
 * @description Doctor authentication controller: Medical License login,
 * registration with council verification simulation, demo credentials autofill, and Guest Doctor entry.
 */

import { Api } from '../shared/api.js';
import { Toast } from '../shared/toast.js';

export class DoctorAuth {
  static init() {
    // 1. Autofill demo credentials
    document.querySelectorAll('.btn-autofill-doctor').forEach(btn => {
      btn.addEventListener('click', () => {
        const license = btn.getAttribute('data-license');
        const pass = btn.getAttribute('data-pass');
        const licenseInput = document.getElementById('license-input');
        const passInput = document.getElementById('password-input');

        if (licenseInput) licenseInput.value = license;
        if (passInput) passInput.value = pass;
        Toast.success(`Filled credentials for ${license}`);
      });
    });

    // 2. Doctor Login
    const loginForm = document.getElementById('doctor-login-form');
    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const license_id = document.getElementById('license-input')?.value.trim();
      const password = document.getElementById('password-input')?.value;
      const btn = document.getElementById('btn-doctor-login');

      if (!license_id || !password) {
        Toast.error('Please enter your Medical License ID and password.');
        return;
      }

      try {
        btn.disabled = true;
        btn.innerText = 'Verifying License...';

        const res = await Api.post('/api/auth/doctor/login', { license_id, password });

        Api.setTokens({
          accessToken: res.tokens.accessToken,
          refreshToken: res.tokens.refreshToken,
          isDoctor: true,
          isGuest: false
        });

        Toast.success(`Welcome, ${res.doctor.name}`);
        setTimeout(() => {
          window.location.href = '/doctor/app.html';
        }, 500);
      } catch (err) {
        Toast.error(err.message || 'Doctor login failed.');
      } finally {
        btn.disabled = false;
        btn.innerText = 'Log In as Doctor';
      }
    });

    // 3. Guest Doctor entry
    document.querySelectorAll('.btn-guest-doctor').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          btn.disabled = true;
          btn.innerText = 'Launching Doctor Sandbox...';

          const res = await Api.post('/api/auth/guest/doctor', {});

          Api.setTokens({
            accessToken: res.token,
            refreshToken: null,
            isDoctor: true,
            isGuest: true
          });

          Toast.success('Guest Doctor session initialized.');
          setTimeout(() => {
            window.location.href = '/doctor/app.html';
          }, 400);
        } catch (err) {
          Toast.error(err.message || 'Failed to start guest doctor session.');
          btn.disabled = false;
          btn.innerText = 'Continue as Guest Doctor';
        }
      });
    });
  }
}

export default DoctorAuth;
