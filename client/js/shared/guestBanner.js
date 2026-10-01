/**
 * @file client/js/shared/guestBanner.js
 * @description Sticky banner displayed across screens in Guest Mode with sample data notice and exit action.
 */

import { Api } from './api.js';

export class GuestBanner {
  static render(containerId = 'guest-banner-slot') {
    const isGuest = localStorage.getItem('medipass_is_guest') === 'true';
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!isGuest) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="sticky top-0 z-[80] bg-amber-500 text-slate-900 font-semibold text-xs px-4 py-2 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-1.5">
          <span>👀</span>
          <span>Guest Mode — sample data only</span>
        </div>
        <button id="exit-guest-btn" class="bg-slate-900 text-white text-[11px] px-2.5 py-1 rounded-full hover:bg-slate-800 transition">
          Exit
        </button>
      </div>
    `;

    container.querySelector('#exit-guest-btn')?.addEventListener('click', async () => {
      try {
        await Api.post('/api/auth/guest/exit', {});
      } catch (e) {}
      Api.clearTokens();
      const isDoctor = window.location.pathname.includes('/doctor');
      window.location.href = isDoctor ? '/doctor/login.html' : '/patient/login.html';
    });
  }
}

export default GuestBanner;
