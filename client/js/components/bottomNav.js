/**
 * @file client/js/components/bottomNav.js
 * @description Bottom navigation bar supporting Instagram-style raised center action
 * for Patient (QR) and Doctor (Scan).
 */

import { I18n } from '../shared/i18n.js';
import { Icons } from '../shared/icons.js';

export class BottomNav {
  static renderPatientNav(activeTab = 'home') {
    return `
      <nav class="fixed bottom-0 inset-x-0 bg-[var(--surface)] border-t border-[var(--border)] z-50 flex items-center justify-around h-16 px-2 shadow-lg">
        <a href="#home" class="bottom-tab-item flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'home' ? 'text-[var(--patient-accent)] font-semibold' : 'text-[var(--text-muted)]'}">
          <i data-lucide="home" class="w-5 h-5 mb-0.5"></i>
          <span class="bottom-tab-label text-[11px]">${I18n.t('navHome')}</span>
        </a>

        <a href="#records" class="bottom-tab-item flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'records' ? 'text-[var(--patient-accent)] font-semibold' : 'text-[var(--text-muted)]'}">
          <i data-lucide="folder-heart" class="w-5 h-5 mb-0.5"></i>
          <span class="bottom-tab-label text-[11px]">${I18n.t('navRecords')}</span>
        </a>

        <!-- Raised Center QR Button -->
        <div class="flex-1 flex justify-center -mt-6">
          <a href="#qr" id="center-qr-btn" class="raised-center-btn flex items-center justify-center text-white" aria-label="Show QR">
            <i data-lucide="qr-code" class="w-7 h-7"></i>
          </a>
        </div>

        <a href="#chat" class="bottom-tab-item flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'chat' ? 'text-[var(--patient-accent)] font-semibold' : 'text-[var(--text-muted)]'}">
          <i data-lucide="sparkles" class="w-5 h-5 mb-0.5 text-purple-500 dark:text-purple-400"></i>
          <span class="bottom-tab-label text-[11px]">${I18n.t('navAskAI')}</span>
        </a>

        <a href="#profile" class="bottom-tab-item flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'profile' ? 'text-[var(--patient-accent)] font-semibold' : 'text-[var(--text-muted)]'}">
          <i data-lucide="user" class="w-5 h-5 mb-0.5"></i>
          <span class="bottom-tab-label text-[11px]">${I18n.t('navProfile')}</span>
        </a>
      </nav>
    `;
  }

  static renderDoctorNav(activeTab = 'home') {
    return `
      <nav class="fixed bottom-0 inset-x-0 bg-[var(--surface)] border-t border-[var(--border)] z-50 flex items-center justify-around h-16 px-2 shadow-lg">
        <a href="#home" class="bottom-tab-item flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'home' ? 'text-[var(--doctor-accent)] font-semibold' : 'text-[var(--text-muted)]'}">
          <i data-lucide="home" class="w-5 h-5 mb-0.5"></i>
          <span class="bottom-tab-label text-[11px]">${I18n.t('navHome')}</span>
        </a>

        <a href="#recent" class="bottom-tab-item flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'recent' ? 'text-[var(--doctor-accent)] font-semibold' : 'text-[var(--text-muted)]'}">
          <i data-lucide="clock" class="w-5 h-5 mb-0.5"></i>
          <span class="bottom-tab-label text-[11px]">${I18n.t('navRecent')}</span>
        </a>

        <!-- Raised Center Scan Button -->
        <div class="flex-1 flex justify-center -mt-6">
          <a href="#scanner" id="center-scan-btn" class="doctor-raised-btn flex items-center justify-center text-white" aria-label="Scan QR">
            <i data-lucide="scan" class="w-7 h-7"></i>
          </a>
        </div>

        <a href="#emergency" class="bottom-tab-item flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'emergency' ? 'text-rose-500 font-semibold' : 'text-[var(--text-muted)]'}">
          <i data-lucide="shield-alert" class="w-5 h-5 mb-0.5 text-rose-500"></i>
          <span class="bottom-tab-label text-[11px] text-rose-500">${I18n.t('navEmergency')}</span>
        </a>

        <a href="#profile" class="bottom-tab-item flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'profile' ? 'text-[var(--doctor-accent)] font-semibold' : 'text-[var(--text-muted)]'}">
          <i data-lucide="stethoscope" class="w-5 h-5 mb-0.5"></i>
          <span class="bottom-tab-label text-[11px]">${I18n.t('navProfile')}</span>
        </a>
      </nav>
    `;
  }
}

export default BottomNav;
