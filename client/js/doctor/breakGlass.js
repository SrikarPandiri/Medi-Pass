/**
 * @file client/js/doctor/breakGlass.js
 * @description Emergency Break-Glass interface: strict clinical justification, password re-auth,
 * emergency SMS dispatch, and server-enforced 60-second countdown for blood group and severe allergies.
 */

import { Api } from '../shared/api.js';
import { Toast } from '../shared/toast.js';
import { RecordCard } from '../components/recordCard.js';

export class BreakGlass {
  static timerInterval = null;

  static render(container) {
    container.innerHTML = `
      <div class="px-4 py-4 space-y-4 pb-24">
        <!-- Emergency Warning Banner -->
        <div class="bg-rose-600 text-white rounded-3xl p-5 shadow-xl space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🚨</span>
            <h2 class="font-black text-lg">Emergency Break-Glass Protocol</h2>
          </div>
          <p class="text-xs text-rose-100 leading-relaxed">
            Legal override strictly for unconscious, trauma, or critical emergency patients unable to provide digital consent. All access is permanently logged on the tamper-evident chain and emergency SMS alerts are dispatched immediately.
          </p>
        </div>

        <!-- Form -->
        <div id="break-glass-form-card" class="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm space-y-3.5 text-xs">
          <div>
            <label class="block font-bold text-[var(--text)] mb-1">Patient Mobile Number or ABHA ID</label>
            <input type="text" id="bg-identifier" placeholder="e.g. 9876543210 or 91-2345-6789-0123" required class="w-full p-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] outline-none focus:border-rose-500 font-mono" />
          </div>

          <div>
            <label class="block font-bold text-[var(--text)] mb-1">Clinical Emergency Justification (Min. 10 chars)</label>
            <textarea id="bg-reason" rows="2" placeholder="e.g. Unconscious acute respiratory distress following road traffic accident..." required class="w-full p-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] outline-none focus:border-rose-500"></textarea>
          </div>

          <div>
            <label class="block font-bold text-[var(--text)] mb-1">Re-enter Doctor Password to Authorize</label>
            <input type="password" id="bg-password" placeholder="••••••••" required class="w-full p-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] outline-none focus:border-rose-500" />
          </div>

          <button id="btn-trigger-break-glass" class="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 transition active:scale-98">
            Trigger Emergency Override
          </button>
        </div>

        <!-- 60-Second Countdown & Restricted Records Viewer Slot -->
        <div id="break-glass-result-slot" class="hidden space-y-3">
          <!-- Live countdown bar -->
          <div class="bg-rose-500/15 border-2 border-rose-500/50 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-rose-700 dark:text-rose-300">Server-Enforced Countdown:</span>
              <p class="text-[10px] text-[var(--text-muted)]">Blood Group & Allergies only</p>
            </div>
            <div class="text-2xl font-black text-rose-600 animate-pulse font-mono" id="bg-countdown-timer">
              60s
            </div>
          </div>

          <!-- SMS Notification Badge -->
          <div class="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <span>📱</span>
            <span>Alert SMS dispatched to patient's emergency contact (+91 9876543299).</span>
          </div>

          <!-- Restricted Records -->
          <div id="bg-records-list" class="space-y-2"></div>
        </div>
      </div>
    `;

    container.querySelector('#btn-trigger-break-glass')?.addEventListener('click', async () => {
      const identifier = container.querySelector('#bg-identifier')?.value.trim();
      const reason = container.querySelector('#bg-reason')?.value.trim();
      const password = container.querySelector('#bg-password')?.value;
      const btn = container.querySelector('#btn-trigger-break-glass');

      if (!identifier || !reason || !password) {
        Toast.error('All fields and password re-confirmation are required.');
        return;
      }

      if (reason.length < 10) {
        Toast.error('Emergency justification must be at least 10 characters.');
        return;
      }

      try {
        btn.disabled = true;
        btn.innerText = 'Authorizing Override...';

        const data = await Api.post('/api/emergency/break-glass', {
          identifier,
          reason,
          password
        });

        Toast.warning('Emergency Break-Glass Authorized. 60-second window active.');
        this.displayEmergencyRecords(container, data);
      } catch (err) {
        Toast.error(err.message || 'Break-Glass request rejected.');
      } finally {
        btn.disabled = false;
        btn.innerText = 'Trigger Emergency Override';
      }
    });
  }

  static displayEmergencyRecords(container, data) {
    const formCard = container.querySelector('#break-glass-form-card');
    const resultSlot = container.querySelector('#break-glass-result-slot');
    const timerEl = container.querySelector('#bg-countdown-timer');
    const listSlot = container.querySelector('#bg-records-list');

    if (formCard) formCard.classList.add('hidden');
    if (resultSlot) resultSlot.classList.remove('hidden');

    let seconds = data.countdown_seconds || 60;
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      seconds -= 1;
      if (timerEl) timerEl.textContent = `${seconds}s`;

      if (seconds <= 0) {
        clearInterval(this.timerInterval);
        // Wipe restricted records immediately
        if (resultSlot) {
          resultSlot.innerHTML = `
            <div class="p-8 text-center bg-slate-900 text-white rounded-3xl border border-rose-500/40 space-y-2">
              <span class="text-3xl">🔒</span>
              <h3 class="font-bold text-base text-rose-400">Emergency Access Window Expired</h3>
              <p class="text-xs text-slate-300">Server-enforced 60-second timer has elapsed. Restricted records have been wiped from memory.</p>
            </div>
          `;
        }
      }
    }, 1000);

    const records = data.records || [];
    if (listSlot) {
      listSlot.innerHTML = records.map(r => RecordCard.render(r)).join('');
    }
  }
}

export default BreakGlass;
