/**
 * @file client/js/components/recordCard.js
 * @description Feed-style medical record card with action row:
 * "🔊 Read aloud", "Ask AI about this", and detailed bottom sheet view.
 */

import { I18n } from '../shared/i18n.js';
import { BottomSheet } from '../shared/sheet.js';

export class RecordCard {
  static typeBadges = {
    'Prescription': 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
    'Allergy': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    'Lab Report': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    'Diagnosis': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    'BloodGroup': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    'Vitals': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
  };

  static render(record, { onReadAloud = null, onAskAI = null } = {}) {
    const badgeClass = this.typeBadges[record.record_type] || 'bg-slate-500/10 text-slate-600 border-slate-500/30';
    const timeFormatted = record.created_at ? new Date(record.created_at).toLocaleDateString() : '';

    let previewContent = '';
    const c = record.content;
    if (typeof c === 'object' && c !== null) {
      if (record.record_type === 'Prescription') {
        previewContent = `${c.medication_name || ''} · ${c.dosage || ''} · ${c.frequency || ''}`;
      } else if (record.record_type === 'Allergy') {
        previewContent = `Allergen: ${c.allergen || ''} (${c.severity || ''})`;
      } else if (record.record_type === 'Lab Report') {
        previewContent = `${c.test_name || ''}: ${c.value !== undefined ? c.value : ''} ${c.unit || ''} [${c.status || 'Reported'}]`;
      } else if (record.record_type === 'Vitals') {
        previewContent = `BP: ${c.blood_pressure || ''} · Pulse: ${c.pulse || ''} · SpO2: ${c.spo2 || ''}`;
      } else if (record.record_type === 'BloodGroup') {
        previewContent = `Blood Type: ${c.blood_group || ''} (Rh ${c.rh_factor || 'Positive'})`;
      } else {
        previewContent = JSON.stringify(c).slice(0, 100);
      }
    } else {
      previewContent = String(c || '').slice(0, 100);
    }

    return `
      <div class="record-card bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm mb-3.5 transition-all hover:shadow-md" data-record-id="${record.record_id}">
        <!-- Header -->
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--text-muted)]">
              ${(record.clinic_name || 'Clinic').charAt(0)}
            </div>
            <div>
              <h4 class="text-xs font-semibold text-[var(--text-muted)]">${record.clinic_name || 'Primary Care Center'}</h4>
              <p class="text-[10px] text-[var(--text-subtle)]">${timeFormatted}</p>
            </div>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}">
            ${record.record_type}
          </span>
        </div>

        <!-- Body -->
        <h3 class="font-bold text-base text-[var(--text)] mb-1">${record.title}</h3>
        <p class="text-xs text-[var(--text-muted)] leading-relaxed mb-3.5">${previewContent}</p>

        <!-- Action Row -->
        <div class="flex items-center justify-between pt-2.5 border-t border-[var(--border)] text-xs font-medium">
          <div class="flex gap-2">
            <button class="btn-read-aloud px-3 py-1.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] flex items-center gap-1.5 hover:bg-[var(--border)] transition">
              <span>🔊</span>
              <span>${I18n.t('readAloud')}</span>
            </button>
            <button class="btn-ask-ai px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1.5 hover:bg-purple-500/20 transition">
              <span>✨</span>
              <span>${I18n.t('askAIAboutThis')}</span>
            </button>
          </div>
          <button class="btn-details text-[var(--text-muted)] hover:text-[var(--text)] text-xs">
            ${I18n.t('viewDetails')} &rarr;
          </button>
        </div>
      </div>
    `;
  }

  static bindEvents(container, records = [], { onReadAloud, onAskAI }) {
    container.querySelectorAll('.record-card').forEach(card => {
      const recordId = card.getAttribute('data-record-id');
      const record = records.find(r => r.record_id === recordId);
      if (!record) return;

      card.querySelector('.btn-read-aloud')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onReadAloud) onReadAloud(record);
      });

      card.querySelector('.btn-ask-ai')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onAskAI) onAskAI(record);
      });

      card.querySelector('.btn-details')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openDetails(record);
      });
    });
  }

  static openDetails(record) {
    const contentPretty = typeof record.content === 'object'
      ? `<pre class="bg-[var(--surface-2)] p-3 rounded-xl text-xs overflow-x-auto text-[var(--text)] font-mono">${JSON.stringify(record.content, null, 2)}</pre>`
      : `<p class="text-sm text-[var(--text)] leading-relaxed">${record.content}</p>`;

    BottomSheet.open({
      title: record.title,
      contentHtml: `
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs text-[var(--text-muted)]">Type: <strong>${record.record_type}</strong></span>
            <span class="text-xs text-[var(--text-muted)]">Date: <strong>${new Date(record.created_at).toLocaleDateString()}</strong></span>
          </div>
          <div class="p-3 bg-[var(--surface-2)] rounded-xl text-xs text-[var(--text-muted)]">
            Facility: <strong>${record.clinic_name || 'Clinical Care Centre'}</strong>
          </div>
          <div class="space-y-1">
            <h4 class="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Clinical Details</h4>
            ${contentPretty}
          </div>
        </div>
      `
    });
  }
}

export default RecordCard;
