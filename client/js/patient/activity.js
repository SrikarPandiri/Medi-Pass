/**
 * @file client/js/patient/activity.js
 * @description Patient Audit & Activity trail notifications view:
 * displays real-time and historical access logs with SHA-256 integrity hashes.
 */

import { Api } from '../shared/api.js';
import { ActivityItem } from '../components/activityItem.js';
import { WsClient } from '../shared/ws.js';

export class PatientActivity {
  static logs = [];

  static async render(container) {
    container.innerHTML = `
      <div class="px-4 py-3 space-y-3 pb-24">
        <div class="flex items-center justify-between pb-2 border-b border-[var(--border)]">
          <div>
            <h2 class="font-bold text-base text-[var(--text)]">Activity & Access Trail</h2>
            <p class="text-xs text-[var(--text-muted)]">Tamper-evident, hash-chained log of every read/write</p>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/10 text-teal-600 border border-teal-500/30">
            Hash-Chained
          </span>
        </div>

        <div id="activity-list-slot" class="space-y-2">
          <p class="text-xs text-[var(--text-muted)] py-6 text-center animate-pulse">Loading audit history...</p>
        </div>
      </div>
    `;

    try {
      const data = await Api.get('/api/patient/audit');
      this.logs = (data.logs || []).reverse();
      this.renderList(container);
    } catch (err) {
      console.warn('Failed to load audit trail:', err);
    }

    // Subscribe to live audit events over WebSocket
    WsClient.on('AUDIT_EVENT', (newLog) => {
      this.logs.unshift(newLog);
      this.renderList(container);
    });
  }

  static renderList(container) {
    const slot = container.querySelector('#activity-list-slot');
    if (!slot) return;

    if (this.logs.length === 0) {
      slot.innerHTML = '<p class="text-xs text-[var(--text-muted)] py-8 text-center">No activity recorded yet.</p>';
      return;
    }

    slot.innerHTML = this.logs.map(l => ActivityItem.render(l)).join('');
  }
}

export default PatientActivity;
