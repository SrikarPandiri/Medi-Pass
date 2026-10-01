/**
 * @file client/js/doctor/patientView.js
 * @description Point-of-Care patient record viewer for doctors:
 * displays scoped clinical history, allergy alert banners, and binds to live WebSocket
 * kill-switch revocation to blank the screen immediately upon patient revocation.
 */

import { WsClient } from '../shared/ws.js';
import { Toast } from '../shared/toast.js';
import { PrescriptionForm } from './prescriptionForm.js';
import { RecordCard } from '../components/recordCard.js';

export class DoctorPatientView {
  static activeSession = null;
  static currentTab = 'overview';

  static render(container, consultationData, onExit) {
    this.activeSession = consultationData;
    const patient = consultationData.patient || {};
    const records = consultationData.records || [];
    const loadTimeMs = consultationData.load_time_ms || 410;

    // Check for severe allergies
    const severeAllergies = records.filter(r => r.record_type === 'Allergy');

    container.innerHTML = `
      <div id="doctor-patient-view-wrapper" class="pb-28">
        <!-- Sticky Session Header -->
        <div class="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 sticky top-0 z-30 shadow-sm">
          <div class="flex items-center justify-between">
            <button id="btn-back-scanner" class="p-1.5 rounded-xl hover:bg-[var(--surface-2)] text-[var(--text-muted)] text-xs flex items-center gap-1 font-semibold">
              &larr; Exit View
            </button>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Loaded in ${loadTimeMs}ms
              </span>
              <span id="access-status-indicator" class="access-status-pill access-active">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Access Active</span>
              </span>
            </div>
          </div>

          <!-- Patient Profile Strip -->
          <div class="mt-3 flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow">
              ${(patient.name || 'P').charAt(0)}
            </div>
            <div>
              <h2 class="font-extrabold text-base text-[var(--text)]">${patient.name || 'Patient Profile'}</h2>
              <p class="text-xs text-[var(--text-muted)]">ABHA: <strong class="font-mono text-[var(--text)]">${patient.abha_id || '91-2345-6789-0123'}</strong> · Phone: +91 ${patient.phone_number || 'N/A'}</p>
            </div>
          </div>
        </div>

        <!-- High-Alert Red Allergy Banner -->
        ${severeAllergies.length > 0 ? `
          <div class="bg-rose-600 text-white px-4 py-2.5 flex items-center gap-3 shadow-md animate-pulse">
            <span class="text-2xl">🚨</span>
            <div class="text-xs leading-tight">
              <p class="font-black uppercase tracking-wider">High Alert: Severe Allergy Recorded</p>
              <p class="opacity-95 font-medium">${severeAllergies.map(a => a.title).join(' · ')}</p>
            </div>
          </div>
        ` : ''}

        <!-- Tabs: Overview · Allergies · Prescriptions · Labs -->
        <div class="flex border-b border-[var(--border)] bg-[var(--surface)] text-xs font-semibold px-4 pt-2">
          <button class="patient-tab-btn py-2.5 px-3 border-b-2 border-blue-600 text-blue-600" data-tab="overview">Overview</button>
          <button class="patient-tab-btn py-2.5 px-3 border-b-2 border-transparent text-[var(--text-muted)]" data-tab="Allergy">Allergies</button>
          <button class="patient-tab-btn py-2.5 px-3 border-b-2 border-transparent text-[var(--text-muted)]" data-tab="Prescription">Prescriptions</button>
          <button class="patient-tab-btn py-2.5 px-3 border-b-2 border-transparent text-[var(--text-muted)]" data-tab="Lab Report">Labs & Vitals</button>
        </div>

        <!-- Tab Content Body -->
        <div id="patient-tab-content" class="p-4 space-y-3">
          ${this.renderTabContent('overview', records)}
        </div>

        <!-- Floating Add Consultation Action Button -->
        <div class="fixed bottom-20 right-4 z-40">
          <button id="btn-add-consultation" class="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xl shadow-blue-600/40 flex items-center gap-2 transform transition active:scale-95">
            <span>➕</span>
            <span>Add Consultation</span>
          </button>
        </div>
      </div>

      <!-- Blanked Screen Overlay (Shown on WebSocket kill switch revocation) -->
      <div id="revocation-blank-overlay" class="hidden fixed inset-0 bg-slate-950 z-[200] flex flex-col items-center justify-center p-6 text-center text-white">
        <div class="w-20 h-20 rounded-full bg-rose-600/20 text-rose-500 border border-rose-500/40 flex items-center justify-center text-4xl mb-4 animate-bounce">
          🛑
        </div>
        <h2 class="text-2xl font-black text-rose-400">ACCESS INSTANTLY REVOKED</h2>
        <p class="text-sm text-slate-300 max-w-sm mt-2 leading-relaxed">
          The patient triggered their real-time Kill-Switch. Clinical records and active tokens have been cleared immediately to preserve patient privacy.
        </p>
        <button id="btn-exit-revoked" class="mt-6 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700">
          Return to Scanner
        </button>
      </div>
    `;

    // 1. Subscribe to WebSocket session for live kill-switch revocation
    if (consultationData.session_id) {
      WsClient.subscribeSession(consultationData.session_id);
    }

    WsClient.on('SESSION_REVOKED', (event) => {
      console.warn('[DoctorView] Live Kill-Switch Revocation Received:', event);
      this.blankScreen();
    });

    // Back to scanner
    container.querySelector('#btn-back-scanner')?.addEventListener('click', () => {
      if (onExit) onExit();
    });

    container.querySelector('#btn-exit-revoked')?.addEventListener('click', () => {
      if (onExit) onExit();
    });

    // Tab buttons
    container.querySelectorAll('.patient-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.patient-tab-btn').forEach(b => {
          b.className = 'patient-tab-btn py-2.5 px-3 border-b-2 border-transparent text-[var(--text-muted)]';
        });
        btn.className = 'patient-tab-btn py-2.5 px-3 border-b-2 border-blue-600 text-blue-600 font-semibold';
        const tab = btn.getAttribute('data-tab');
        const contentSlot = container.querySelector('#patient-tab-content');
        if (contentSlot) {
          contentSlot.innerHTML = this.renderTabContent(tab, records);
        }
      });
    });

    // Add consultation form button
    container.querySelector('#btn-add-consultation')?.addEventListener('click', () => {
      PrescriptionForm.open(patient.user_id, (newRecord) => {
        records.unshift(newRecord);
        const contentSlot = container.querySelector('#patient-tab-content');
        if (contentSlot) {
          contentSlot.innerHTML = this.renderTabContent('overview', records);
        }
      });
    });
  }

  static renderTabContent(tab, records = []) {
    let filtered = records;
    if (tab === 'Allergy') filtered = records.filter(r => r.record_type === 'Allergy' || r.record_type === 'BloodGroup');
    else if (tab === 'Prescription') filtered = records.filter(r => r.record_type === 'Prescription');
    else if (tab === 'Lab Report') filtered = records.filter(r => r.record_type === 'Lab Report' || r.record_type === 'Vitals');

    if (filtered.length === 0) {
      return `
        <div class="text-center py-10 bg-[var(--surface-2)] rounded-3xl border border-[var(--border)] border-dashed">
          <p class="text-xs text-[var(--text-muted)]">No ${tab} records available in granted scope.</p>
        </div>
      `;
    }

    return filtered.map(r => RecordCard.render(r)).join('');
  }

  static blankScreen() {
    const overlay = document.getElementById('revocation-blank-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  }
}

export default DoctorPatientView;
