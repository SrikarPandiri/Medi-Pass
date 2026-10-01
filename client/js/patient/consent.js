/**
 * @file client/js/patient/consent.js
 * @description Patient AI Consent Bottom Sheet: transparent plain-language privacy disclosure
 * ensuring patients explicitly authorize AI access to de-identified clinical records.
 */

import { Api } from '../shared/api.js';
import { Toast } from '../shared/toast.js';
import { BottomSheet } from '../shared/sheet.js';

export class ConsentManager {
  /**
   * Prompts the patient with the AI consent bottom sheet if not already decided
   */
  static showAiConsentSheet(currentUser, onConsented) {
    const contentHtml = `
      <div class="space-y-4 text-center">
        <div class="w-16 h-16 mx-auto rounded-full bg-purple-500/15 text-purple-600 flex items-center justify-center text-3xl shadow-inner">
          ✨
        </div>
        <div>
          <h3 class="font-bold text-lg text-[var(--text)]">Enable MediPass AI Assistant?</h3>
          <p class="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto leading-relaxed">
            MediPass Assistant can explain your blood reports, clarify medication timings, and translate medical summaries into your native language.
          </p>
        </div>

        <div class="bg-[var(--surface-2)] p-4 rounded-2xl border border-[var(--border)] text-left text-xs space-y-2">
          <p class="font-bold text-[var(--text)]">Privacy Guarantee:</p>
          <ul class="space-y-1.5 text-[var(--text-muted)]">
            <li class="flex items-start gap-1.5">
              <span class="text-teal-500 font-bold">✓</span>
              <span><strong>Allowed:</strong> Medical reports, prescriptions, lab numbers, and allergy alerts.</span>
            </li>
            <li class="flex items-start gap-1.5">
              <span class="text-rose-500 font-bold">✗</span>
              <span><strong>Never Shared:</strong> Your name, phone number, address, and ABHA ID are automatically redacted.</span>
            </li>
            <li class="flex items-start gap-1.5">
              <span class="text-teal-500 font-bold">✓</span>
              <span><strong>Control:</strong> You can revoke this permission anytime with a single tap in Profile.</span>
            </li>
          </ul>
        </div>

        <div class="flex flex-col gap-2 pt-2">
          <button id="btn-grant-ai-consent" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition">
            Allow AI to Read My Records
          </button>
          <button id="btn-decline-ai-consent" class="w-full py-2.5 rounded-2xl bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] font-semibold text-xs transition">
            Ask General Health Questions Only
          </button>
        </div>
      </div>
    `;

    BottomSheet.open({
      title: 'AI Clinical Privacy',
      contentHtml,
      onRender: (body, closeSheet) => {
        body.querySelector('#btn-grant-ai-consent')?.addEventListener('click', async () => {
          try {
            await Api.post('/api/patient/ai-consent', { consent: true });
            Toast.success('AI Consent Granted');
            closeSheet();
            if (onConsented) onConsented(true);
          } catch (err) {
            Toast.error(err.message || 'Failed to update consent');
          }
        });

        body.querySelector('#btn-decline-ai-consent')?.addEventListener('click', async () => {
          try {
            await Api.post('/api/patient/ai-consent', { consent: false });
            Toast.info('General AI Mode Active (No personal records read)');
            closeSheet();
            if (onConsented) onConsented(false);
          } catch (err) {
            Toast.error(err.message);
          }
        });
      }
    });
  }
}

export default ConsentManager;
