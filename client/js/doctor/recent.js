/**
 * @file client/js/doctor/recent.js
 * @description YouTube-style thumbnail carousel and list for patients consulted in the past 24 hours.
 */

import { Api } from '../shared/api.js';

export class DoctorRecent {
  static async render(container, onSelectPatient) {
    container.innerHTML = `
      <div class="px-4 py-4 space-y-3 pb-24">
        <div>
          <h2 class="font-bold text-base text-[var(--text)]">Recent Point-of-Care Consultations</h2>
          <p class="text-xs text-[var(--text-muted)]">Patients consulted in the last 24 hours</p>
        </div>

        <div id="recent-patients-list" class="space-y-2.5">
          <p class="text-xs text-[var(--text-muted)] py-8 text-center animate-pulse">Loading recent consultations...</p>
        </div>
      </div>
    `;

    try {
      const data = await Api.get('/api/doctor/recent');
      const recent = data.recent || [];
      const listSlot = container.querySelector('#recent-patients-list');

      if (recent.length === 0) {
        if (listSlot) {
          listSlot.innerHTML = `
            <div class="text-center py-10 bg-[var(--surface-2)] rounded-3xl border border-[var(--border)] border-dashed">
              <p class="text-xs text-[var(--text-muted)]">No consultations logged in the last 24 hours.</p>
            </div>
          `;
        }
        return;
      }

      if (listSlot) {
        listSlot.innerHTML = recent.map(p => `
          <div class="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3.5 flex items-center justify-between shadow-sm hover:shadow transition">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 font-bold flex items-center justify-center text-sm border border-blue-500/20">
                ${p.name.charAt(0)}
              </div>
              <div>
                <h4 class="font-bold text-xs text-[var(--text)]">${p.name}</h4>
                <p class="text-[10px] text-[var(--text-muted)] font-mono">ABHA: ${p.abha_id || '91-2345-6789-0123'}</p>
                <p class="text-[10px] text-[var(--text-subtle)]">${new Date(p.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Consulted
            </span>
          </div>
        `).join('');
      }
    } catch (err) {
      console.warn('Failed to load recent consultations:', err);
    }
  }
}

export default DoctorRecent;
