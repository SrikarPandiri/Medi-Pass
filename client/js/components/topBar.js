/**
 * @file client/js/components/topBar.js
 * @description Top header bar for Patient and Doctor apps featuring theme toggle,
 * notifications bell, elderly-mode switch, and language selector.
 */

import { ThemeManager } from '../shared/theme.js';
import { I18n } from '../shared/i18n.js';

export class TopBar {
  static renderPatientTopBar(user = {}) {
    const isElderly = document.body.classList.contains('elderly-mode');
    const theme = ThemeManager.getTheme();

    return `
      <header class="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            MP
          </div>
          <div>
            <h1 class="font-bold text-base tracking-tight text-[var(--text)]">MediPass</h1>
            <p class="text-[10px] text-[var(--text-muted)] -mt-1">${user.name ? `Namaste, ${user.name.split(' ')[0]}` : 'Patient Portal'}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Elderly Mode Toggle -->
          <button id="toggle-elderly-btn" title="Toggle Elderly Accessible Mode" class="px-2 py-1 rounded-xl text-xs font-semibold border ${isElderly ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]'}">
            👵 ${I18n.t('elderlyMode')}
          </button>

          <!-- Theme Toggle -->
          <button id="toggle-theme-btn" title="Toggle Light/Dark/System Theme" class="p-2 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]">
            <i data-lucide="${theme === 'dark' ? 'moon' : 'sun'}" class="w-4 h-4"></i>
          </button>

          <!-- Notifications Bell -->
          <a href="#activity" class="p-2 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] relative">
            <i data-lucide="bell" class="w-4 h-4"></i>
            <span class="absolute top-1 right-1 w-2 h-2 bg-teal-500 rounded-full"></span>
          </a>
        </div>
      </header>
    `;
  }

  static renderDoctorTopBar(doctor = {}) {
    const theme = ThemeManager.getTheme();

    return `
      <header class="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            Rx
          </div>
          <div>
            <h1 class="font-bold text-base tracking-tight text-[var(--text)]">${doctor.clinic_name || 'Clinical Care'}</h1>
            <p class="text-[10px] text-[var(--text-muted)] -mt-1">${doctor.name || 'Doctor Terminal'} · <span class="text-blue-500 font-semibold">${doctor.license_id || 'VERIFIED'}</span></p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Theme Toggle -->
          <button id="toggle-theme-btn" title="Toggle Theme" class="p-2 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]">
            <i data-lucide="${theme === 'dark' ? 'moon' : 'sun'}" class="w-4 h-4"></i>
          </button>

          <!-- Doctor Status Pill -->
          <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
      </header>
    `;
  }

  static bindEvents() {
    document.getElementById('toggle-theme-btn')?.addEventListener('click', () => {
      ThemeManager.toggle();
      window.location.reload();
    });

    document.getElementById('toggle-elderly-btn')?.addEventListener('click', () => {
      document.body.classList.toggle('elderly-mode');
      const isElderly = document.body.classList.contains('elderly-mode');
      localStorage.setItem('medipass_elderly_mode', isElderly ? 'true' : 'false');
      const btn = document.getElementById('toggle-elderly-btn');
      if (btn) {
        if (isElderly) {
          btn.className = 'px-2 py-1 rounded-xl text-xs font-semibold border bg-amber-500 text-slate-900 border-amber-400';
        } else {
          btn.className = 'px-2 py-1 rounded-xl text-xs font-semibold border bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]';
        }
      }
    });
  }
}

export default TopBar;
