/**
 * @file client/js/patient/auth.js
 * @description Patient login and registration logic: Mobile OTP, PIN login,
 * demo credentials autofill card, and one-tap Guest Mode entry.
 */

import { Api } from '../shared/api.js';
import { Toast } from '../shared/toast.js';

export class PatientAuth {
  static init() {
    // 1. Demo Credentials Autofill
    document.querySelectorAll('.btn-autofill-patient').forEach(btn => {
      btn.addEventListener('click', () => {
        const phone = btn.getAttribute('data-phone');
        const pin = btn.getAttribute('data-pin');
        const phoneInput = document.getElementById('phone-input');
        const pinInput = document.getElementById('pin-input');

        if (phoneInput) phoneInput.value = phone;
        if (pinInput) pinInput.value = pin;
        Toast.success(`Filled demo credentials for ${phone}`);
      });
    });

    // 2. Request OTP
    const btnSendOtp = document.getElementById('btn-send-otp');
    btnSendOtp?.addEventListener('click', async () => {
      const phone = document.getElementById('phone-input')?.value.trim();
      if (!phone || phone.length < 10) {
        Toast.error('Please enter a valid 10-digit mobile number.');
        return;
      }

      try {
        btnSendOtp.disabled = true;
        btnSendOtp.innerText = 'Sending...';

        const res = await Api.post('/api/auth/patient/otp/request', { phone });
        Toast.success(`OTP sent to +91 ${res.phone}`);

        // Show dev OTP banner for convenient testing
        const devBanner = document.getElementById('dev-otp-banner');
        if (devBanner) {
          devBanner.classList.remove('hidden');
          devBanner.innerHTML = `🔑 <strong>Dev OTP:</strong> <span class="font-mono text-sm underline">${res.devOtp}</span> (Simulated SMS)`;
        }

        // Switch to OTP verify step
        document.getElementById('step-phone')?.classList.add('hidden');
        document.getElementById('step-otp')?.classList.remove('hidden');
        document.getElementById('otp-input')?.focus();
      } catch (err) {
        Toast.error(err.message || 'Failed to send OTP.');
      } finally {
        btnSendOtp.disabled = false;
        btnSendOtp.innerText = 'Get OTP';
      }
    });

    // 3. Verify OTP
    const btnVerifyOtp = document.getElementById('btn-verify-otp');
    btnVerifyOtp?.addEventListener('click', async () => {
      const phone = document.getElementById('phone-input')?.value.trim();
      const otp = document.getElementById('otp-input')?.value.trim();

      if (!otp || otp.length !== 6) {
        Toast.error('Please enter the 6-digit OTP code.');
        return;
      }

      try {
        btnVerifyOtp.disabled = true;
        btnVerifyOtp.innerText = 'Verifying...';

        const res = await Api.post('/api/auth/patient/otp/verify', { phone, otp });

        if (res.isNewUser) {
          // Redirect to sign-up to complete name, language, PIN
          window.location.href = `/patient/signup.html?phone=${encodeURIComponent(phone)}`;
          return;
        }

        // Store tokens & redirect to app
        Api.setTokens({
          accessToken: res.tokens.accessToken,
          refreshToken: res.tokens.refreshToken,
          isDoctor: false,
          isGuest: false
        });

        Toast.success('Login successful! Welcome back.');
        setTimeout(() => {
          window.location.href = '/patient/app.html';
        }, 500);
      } catch (err) {
        Toast.error(err.message || 'OTP verification failed.');
      } finally {
        btnVerifyOtp.disabled = false;
        btnVerifyOtp.innerText = 'Verify & Proceed';
      }
    });

    // 4. PIN Login
    const btnPinLogin = document.getElementById('btn-pin-login');
    btnPinLogin?.addEventListener('click', async () => {
      const phone = document.getElementById('phone-input')?.value.trim();
      const pin = document.getElementById('pin-input')?.value.trim();

      if (!phone || !pin) {
        Toast.error('Please enter both mobile number and your security PIN.');
        return;
      }

      try {
        btnPinLogin.disabled = true;
        btnPinLogin.innerText = 'Logging in...';

        const res = await Api.post('/api/auth/patient/pin-login', { phone, pin });

        Api.setTokens({
          accessToken: res.tokens.accessToken,
          refreshToken: res.tokens.refreshToken,
          isDoctor: false,
          isGuest: false
        });

        Toast.success('Login successful!');
        setTimeout(() => {
          window.location.href = '/patient/app.html';
        }, 500);
      } catch (err) {
        Toast.error(err.message || 'PIN login failed.');
      } finally {
        btnPinLogin.disabled = false;
        btnPinLogin.innerText = 'Login with PIN';
      }
    });

    // 5. One-tap Guest Mode entry
    document.querySelectorAll('.btn-guest-patient').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          btn.disabled = true;
          btn.innerText = 'Launching Sandbox...';
          const res = await Api.post('/api/auth/guest/patient', {});

          Api.setTokens({
            accessToken: res.token,
            refreshToken: null,
            isDoctor: false,
            isGuest: true
          });

          Toast.success('Guest sandbox active with sample patient data.');
          setTimeout(() => {
            window.location.href = '/patient/app.html';
          }, 400);
        } catch (err) {
          Toast.error(err.message || 'Failed to start Guest Mode.');
          btn.disabled = false;
          btn.innerText = 'Continue as Guest';
        }
      });
    });
  }
}

export default PatientAuth;
