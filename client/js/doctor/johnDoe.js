/**
 * @file client/js/doctor/johnDoe.js
 * @description John Doe trauma intake protocol: temporary chart creation for unidentified patients,
 * treatment logging, and retroactive identity linkage.
 */

import { Api } from '../shared/api.js';
import { Toast } from '../shared/toast.js';

export class JohnDoe {
  static render(container) {
    container.innerHTML = `
      <div class="px-4 py-4 space-y-4 pb-24">
        <div class="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-xl space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-2xl">👤</span>
            <h2 class="font-extrabold text-base">John Doe Trauma Intake</h2>
          </div>
          <p class="text-xs text-slate-300">
            Create a temporary emergency chart for unidentified arrivals. All interventions are timestamped and can be retroactively linked to a permanent ABHA account upon patient or family identification.
          </p>
        </div>

        <!-- Intake Form -->
        <form id="john-doe-form" class="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-[var(--text)] mb-1">Estimated Age</label>
              <input type="text" id="jd-age" placeholder="e.g. Approx 35-40" required class="w-full p-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] outline-none" />
            </div>
            <div>
              <label class="block font-bold text-[var(--text)] mb-1">Estimated Sex</label>
              <select id="jd-sex" class="w-full p-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] outline-none">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other / Indeterminate</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-[var(--text)] mb-1">Identifying Physical Features</label>
            <input type="text" id="jd-features" placeholder="e.g. Scar on left forearm, black jacket..." class="w-full p-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] outline-none" />
          </div>

          <div>
            <label class="block font-bold text-[var(--text)] mb-1">Initial Triage Priority</label>
            <select id="jd-triage" class="w-full p-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] font-bold outline-none">
              <option value="RED" class="text-rose-600 font-bold">🔴 Priority 1 - Critical (Red)</option>
              <option value="YELLOW" class="text-amber-600 font-bold">🟡 Priority 2 - Urgent (Yellow)</option>
              <option value="GREEN" class="text-emerald-600 font-bold">🟢 Priority 3 - Delayed (Green)</option>
            </select>
          </div>

          <button type="submit" id="btn-create-john-doe" class="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg transition">
            Initialize John Doe Trauma Chart
          </button>
        </form>

        <!-- Active John Doe Charts List -->
        <div id="active-john-doe-list" class="space-y-3"></div>
      </div>
    `;

    container.querySelector('#john-doe-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const estimated_age = container.querySelector('#jd-age')?.value.trim();
      const sex = container.querySelector('#jd-sex')?.value;
      const identifying_marks = container.querySelector('#jd-features')?.value.trim();
      const triage_priority = container.querySelector('#jd-triage')?.value;

      try {
        const res = await Api.post('/api/emergency/john-doe', {
          estimated_age,
          sex,
          identifying_marks,
          triage_priority
        });

        Toast.success(`Chart created: ${res.emergency.chart.pseudonym}`);
        container.querySelector('#john-doe-form')?.reset();
        this.renderChartItem(container, res.emergency);
      } catch (err) {
        Toast.error('Failed to create trauma chart.');
      }
    });
  }

  static renderChartItem(container, emergency) {
    const list = container.querySelector('#active-john-doe-list');
    if (!list) return;

    const item = document.createElement('div');
    item.className = 'bg-[var(--surface)] border-2 border-slate-700 rounded-2xl p-4 shadow-md space-y-2 text-xs';
    item.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-extrabold text-sm text-[var(--text)]">${emergency.chart.pseudonym}</span>
        <span class="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-500/15 text-rose-600">Triage: ${emergency.chart.triage_priority}</span>
      </div>
      <p class="text-[var(--text-muted)]">Age: ${emergency.chart.estimated_age} · Sex: ${emergency.chart.sex}</p>
      <p class="text-[var(--text-muted)]">Marks: ${emergency.chart.identifying_marks}</p>

      <div class="pt-2 flex gap-2">
        <button class="btn-append-treatment flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition">
          + Treatment Log
        </button>
        <button class="btn-link-patient flex-1 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition">
          🔗 Link to Patient
        </button>
      </div>
    `;

    item.querySelector('.btn-append-treatment')?.addEventListener('click', async () => {
      const treatment = prompt('Enter treatment or medication administered:');
      if (treatment) {
        await Api.post(`/api/emergency/john-doe/${emergency.emergency_id}/treatment`, {
          treatment_description: treatment
        });
        Toast.success('Treatment appended to emergency chart.');
      }
    });

    item.querySelector('.btn-link-patient')?.addEventListener('click', async () => {
      const patientId = prompt('Enter verified Patient ID (e.g. p-lakshmi-001):');
      if (patientId) {
        try {
          await Api.post(`/api/emergency/john-doe/${emergency.emergency_id}/link`, {
            patient_id: patientId
          });
          Toast.success('Trauma chart linked to patient records.');
          item.remove();
        } catch (err) {
          Toast.error(err.message || 'Linkage failed.');
        }
      }
    });

    list.prepend(item);
  }
}

export default JohnDoe;
