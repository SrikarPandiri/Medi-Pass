/**
 * @file client/js/components/qrModal.js
 * @description Rolling dynamic QR code bottom sheet: 45-second animated countdown ring,
 * auto-rotation on expiry, scope filters, and instant Live Kill-Switch button.
 */

import { Api } from '../shared/api.js';
import { Toast } from '../shared/toast.js';
import { I18n } from '../shared/i18n.js';
import { BottomSheet } from '../shared/sheet.js';

export class QrModal {
  static timerInterval = null;
  static activeSessionId = null;

  static open(patientId) {
    let currentSeconds = 45;

    const contentHtml = `
      <div class="flex flex-col items-center text-center space-y-4">
        <!-- Pure white background tile for scanning contrast in both light & dark themes -->
        <div class="p-4 bg-white rounded-3xl shadow-md border border-slate-200">
          <div id="qr-code-canvas-container" class="w-56 h-56 flex items-center justify-center">
            <span class="text-xs text-slate-400 animate-pulse">Generating Secure QR...</span>
          </div>
        </div>

        <!-- 45s Countdown Pill -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)]">
          <span class="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping"></span>
          <span>Rolling QR refreshes in: <strong id="qr-timer-count" class="text-teal-600 dark:text-teal-400">45s</strong></span>
        </div>

        <!-- Scope selection summary -->
        <div class="w-full bg-[var(--surface-2)] p-3 rounded-2xl border border-[var(--border)] text-left text-xs">
          <p class="font-bold text-[var(--text)] mb-1">Shared Scopes:</p>
          <div class="flex flex-wrap gap-1.5 text-[11px] text-[var(--text-muted)]">
            <span class="bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--border)]">✓ Allergies</span>
            <span class="bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--border)]">✓ Prescriptions</span>
            <span class="bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--border)]">✓ Lab Reports</span>
            <span class="bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--border)]">✓ Vitals</span>
          </div>
        </div>

        <!-- Live Kill Switch -->
        <button id="qr-kill-switch-btn" class="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition active:scale-98">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
          <span>${I18n.t('revokeAccess')}</span>
        </button>
      </div>
    `;

    const sheet = BottomSheet.open({
      title: 'Scan at Point-of-Care',
      contentHtml,
      onRender: (body, closeSheet) => {
        const renderQR = async () => {
          try {
            const data = await Api.post('/api/consent/session', {
              scopes: ['allergies', 'prescriptions', 'lab_reports', 'vitals']
            });
            this.activeSessionId = data.session_id;

            const container = body.querySelector('#qr-code-canvas-container');
            if (container && window.QRCode) {
              container.innerHTML = '';
              new window.QRCode(container, {
                text: data.qr_token,
                width: 224,
                height: 224,
                colorDark: '#0f172a',
                colorLight: '#ffffff',
                correctLevel: window.QRCode.CorrectLevel.M
              });
            } else if (container) {
              // Fallback text rendering if QRCode library not yet loaded
              container.innerHTML = `<div class="p-2 break-all text-[9px] font-mono text-slate-800">${data.qr_token.slice(0, 140)}...</div>`;
            }

            // Start countdown
            currentSeconds = 45;
            const timerEl = body.querySelector('#qr-timer-count');
            if (this.timerInterval) clearInterval(this.timerInterval);

            this.timerInterval = setInterval(() => {
              currentSeconds -= 1;
              if (timerEl) timerEl.textContent = `${currentSeconds}s`;

              if (currentSeconds <= 0) {
                // Auto-rotate on expiry
                renderQR();
              }
            }, 1000);
          } catch (err) {
            Toast.error(err.message || 'Failed to generate QR');
          }
        };

        renderQR();

        // Kill Switch Handler - acts immediately without confirm dialog
        body.querySelector('#qr-kill-switch-btn')?.addEventListener('click', async () => {
          if (!this.activeSessionId) return;
          try {
            await Api.post('/api/consent/revoke', { sessionId: this.activeSessionId });
            Toast.warning('Access Revoked. Doctor screen locked.');
            closeSheet();
          } catch (err) {
            Toast.error(err.message || 'Revocation failed');
          }
        });
      },
      onClose: () => {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
      }
    });
  }
}

export default QrModal;
