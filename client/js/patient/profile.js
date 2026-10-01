/**
 * @file client/js/patient/profile.js
 * @description Patient profile settings: ABHA identity card, AI consent switch,
 * language preferences, elderly mode toggle, and multi-session logout controls.
 */

import { Api } from '../shared/api.js';
import { Toast } from '../shared/toast.js';
import { I18n } from '../shared/i18n.js';
import { ThemeManager } from '../shared/theme.js';
import { LanguagePicker } from '../components/languagePicker.js';

export class PatientProfile {
  static async render(container, user = {}, isGuest = false) {
    const isElderly = document.body.classList.contains('elderly-mode');
    const currentTheme = ThemeManager.getTheme();

    container.innerHTML = `
      <div class="px-4 py-3 space-y-4 pb-28">
        <!-- ABHA Health Card -->
        <div class="bg-gradient-to-tr from-teal-700 via-teal-800 to-slate-900 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold tracking-widest uppercase opacity-80">National Health Authority · ABDM</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20">Verified</span>
          </div>

          <div class="mt-4 flex items-center gap-3">
            <div class="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-bold">
              ${(user.name || 'P').charAt(0)}
            </div>
            <div>
              <h3 class="font-bold text-lg leading-snug">${user.name || 'Patient'}</h3>
              <p class="text-xs font-mono opacity-85">ABHA: ${user.abha_id || '91-2345-6789-0123'}</p>
              <p class="text-[11px] opacity-75 mt-0.5">+91 ${user.phone_number || '9876543210'}</p>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] opacity-90">
            <span>Emergency Contact: ${user.emergency_contact_phone || 'None'}</span>
            <span>Blood Group: <strong>O+</strong></span>
          </div>
        </div>

        <!-- Guest Mode Call-To-Action if in Guest Mode -->
        ${isGuest ? `
          <div class="bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-4 space-y-2">
            <div class="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
              <span>👀</span>
              <span>You are exploring in Guest Mode</span>
            </div>
            <p class="text-xs text-[var(--text-muted)]">Data is stored in a private in-memory sandbox and will disappear when you exit.</p>
            <div class="flex gap-2 pt-1">
              <a href="/patient/signup.html" class="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold shadow hover:bg-teal-700 transition">Create Permanent Account</a>
              <button id="btn-profile-exit-guest" class="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] text-xs font-medium">Exit Guest</button>
            </div>
          </div>
        ` : ''}

        <!-- Settings Groups -->
        <div class="bg-[var(--surface)] border border-[var(--border)] rounded-2xl divide-y divide-[var(--border)] shadow-sm">
          <!-- AI Assistant Consent -->
          <div class="p-4 flex items-center justify-between">
            <div>
              <h4 class="font-bold text-sm text-[var(--text)]">Let MediPass AI Read My Records</h4>
              <p class="text-xs text-[var(--text-muted)]">Allows assistant to ground answers in your lab reports</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="toggle-ai-consent" class="sr-only peer" ${user.ai_consent ? 'checked' : ''} />
              <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <!-- Language Preference -->
          <div class="p-4 flex items-center justify-between">
            <div>
              <h4 class="font-bold text-sm text-[var(--text)]">Preferred Language</h4>
              <p class="text-xs text-[var(--text-muted)]">UI and speech synthesis language</p>
            </div>
            <div id="profile-lang-picker-slot">
              ${LanguagePicker.render(I18n.currentLanguage)}
            </div>
          </div>

          <!-- Elderly Mode -->
          <div class="p-4 flex items-center justify-between">
            <div>
              <h4 class="font-bold text-sm text-[var(--text)]">Elderly Accessible Mode</h4>
              <p class="text-xs text-[var(--text-muted)]">Larger fonts, 56px+ targets, high contrast</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="toggle-elderly-profile" class="sr-only peer" ${isElderly ? 'checked' : ''} />
              <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <!-- Theme -->
          <div class="p-4 flex items-center justify-between">
            <div>
              <h4 class="font-bold text-sm text-[var(--text)]">Theme Mode</h4>
              <p class="text-xs text-[var(--text-muted)]">Light, Dark, or follow System</p>
            </div>
            <select id="profile-theme-select" class="bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] rounded-xl px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer">
              <option value="system" ${currentTheme === 'system' ? 'selected' : ''}>System</option>
              <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light</option>
              <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
            </select>
          </div>
        </div>

        <!-- Session & Logout -->
        <div class="space-y-2">
          <button id="btn-patient-logout" class="w-full py-3 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--border)] border border-[var(--border)] text-rose-600 dark:text-rose-400 font-bold text-xs transition">
            Log Out of This Device
          </button>
          <button id="btn-patient-logout-all" class="w-full py-2 text-[11px] text-[var(--text-muted)] hover:underline">
            Log Out of All Devices & Terminals
          </button>
        </div>
      </div>
    `;

    // AI Consent Toggle Event
    container.querySelector('#toggle-ai-consent')?.addEventListener('change', async (e) => {
      const isGranted = e.target.checked;
      try {
        await Api.post('/api/patient/ai-consent', { consent: isGranted });
        Toast.success(isGranted ? 'AI Consent Granted' : 'AI Consent Revoked');
      } catch (err) {
        Toast.error('Failed to update consent.');
        e.target.checked = !isGranted;
      }
    });

    // Language Picker Event
    LanguagePicker.bindEvents(container.querySelector('#profile-lang-picker-slot'), (lang) => {
      Toast.success(`Language set to ${lang.toUpperCase()}`);
    });

    // Elderly Mode Toggle Event
    container.querySelector('#toggle-elderly-profile')?.addEventListener('change', (e) => {
      document.body.classList.toggle('elderly-mode', e.target.checked);
      localStorage.setItem('medipass_elderly_mode', e.target.checked ? 'true' : 'false');
    });

    // Theme select
    container.querySelector('#profile-theme-select')?.addEventListener('change', (e) => {
      ThemeManager.applyTheme(e.target.value);
    });

    // Exit Guest
    container.querySelector('#btn-profile-exit-guest')?.addEventListener('click', async () => {
      try {
        await Api.post('/api/auth/guest/exit', {});
      } catch (e) {}
      Api.clearTokens();
      window.location.href = '/patient/login.html';
    });

    // Logout
    container.querySelector('#btn-patient-logout')?.addEventListener('click', async () => {
      try {
        await Api.post('/api/auth/patient/logout', {});
      } catch (e) {}
      Api.clearTokens();
      window.location.href = '/patient/login.html';
    });

    container.querySelector('#btn-patient-logout-all')?.addEventListener('click', async () => {
      try {
        await Api.post('/api/auth/patient/logout-all', { userId: user.user_id });
      } catch (e) {}
      Api.clearTokens();
      window.location.href = '/patient/login.html';
    });
  }
}

export default PatientProfile;
