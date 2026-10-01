/**
 * @file client/js/doctor/profile.js
 * @description Doctor profile, clinical facility registration card, theme switcher, and logout.
 */

import { Api } from '../shared/api.js';
import { ThemeManager } from '../shared/theme.js';

export class DoctorProfile {
  static render(container, doctor = {}, isGuest = false) {
    const currentTheme = ThemeManager.getTheme();

    container.innerHTML = `
      <div class="px-4 py-4 space-y-4 pb-28">
        <!-- Medical Council Verification Card -->
        <div class="bg-gradient-to-tr from-blue-700 via-blue-800 to-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold tracking-widest uppercase opacity-80">National Medical Commission (NMC)</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500 text-white shadow-sm">Verified</span>
          </div>

          <div class="flex items-center gap-3">
            <div class="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-bold">
              👨‍⚕️
            </div>
            <div>
              <h3 class="font-extrabold text-lg leading-snug">${doctor.name || 'Dr. Anita Rao'}</h3>
              <p class="text-xs text-blue-200 font-semibold">${doctor.specialization || 'General Medicine'}</p>
              <p class="text-xs font-mono opacity-85 mt-0.5">License: <strong>${doctor.license_id || 'TSMC-12345'}</strong></p>
            </div>
          </div>

          <div class="pt-3 border-t border-white/15 text-xs opacity-90">
            <p>Practice: <strong>${doctor.clinic_name || 'Sunrise Clinic'}</strong></p>
            <p class="text-[11px] text-blue-200">${doctor.clinic_city || 'Hyderabad'}</p>
          </div>
        </div>

        <!-- Guest Doctor Banner -->
        ${isGuest ? `
          <div class="bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-4 space-y-2">
            <div class="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
              <span>👀</span>
              <span>Guest Doctor Sandbox Active</span>
            </div>
            <p class="text-xs text-[var(--text-muted)]">Prescriptions and John Doe trauma charts are isolated in memory and will not touch production tables.</p>
            <button id="btn-doc-exit-guest" class="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-700 transition">
              Exit Guest Mode
            </button>
          </div>
        ` : ''}

        <!-- Settings Card -->
        <div class="bg-[var(--surface)] border border-[var(--border)] rounded-2xl divide-y divide-[var(--border)] shadow-sm">
          <div class="p-4 flex items-center justify-between">
            <div>
              <h4 class="font-bold text-sm text-[var(--text)]">Theme Mode</h4>
              <p class="text-xs text-[var(--text-muted)]">Light, Dark, or System</p>
            </div>
            <select id="doc-theme-select" class="bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] rounded-xl px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer">
              <option value="system" ${currentTheme === 'system' ? 'selected' : ''}>System</option>
              <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light</option>
              <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
            </select>
          </div>
        </div>

        <!-- Logout -->
        <div class="space-y-2">
          <button id="btn-doctor-logout" class="w-full py-3.5 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--border)] border border-[var(--border)] text-rose-600 dark:text-rose-400 font-bold text-xs transition">
            Log Out of Clinical Terminal
          </button>
          <button id="btn-doctor-logout-all" class="w-full py-2 text-[11px] text-[var(--text-muted)] hover:underline">
            Revoke All Active Terminal Sessions
          </button>
        </div>
      </div>
    `;

    container.querySelector('#doc-theme-select')?.addEventListener('change', (e) => {
      ThemeManager.applyTheme(e.target.value);
    });

    container.querySelector('#btn-doc-exit-guest')?.addEventListener('click', async () => {
      try {
        await Api.post('/api/auth/guest/exit', {});
      } catch (e) {}
      Api.clearTokens();
      window.location.href = '/doctor/login.html';
    });

    container.querySelector('#btn-doctor-logout')?.addEventListener('click', async () => {
      try {
        await Api.post('/api/auth/doctor/logout', {});
      } catch (e) {}
      Api.clearTokens();
      window.location.href = '/doctor/login.html';
    });

    container.querySelector('#btn-doctor-logout-all')?.addEventListener('click', async () => {
      try {
        await Api.post('/api/auth/doctor/logout-all', { userId: doctor.user_id });
      } catch (e) {}
      Api.clearTokens();
      window.location.href = '/doctor/login.html';
    });
  }
}

export default DoctorProfile;
