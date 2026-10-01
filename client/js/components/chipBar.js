/**
 * @file client/js/components/chipBar.js
 * @description Horizontal filter chips bar for records categories.
 */

import { I18n } from '../shared/i18n.js';

export class ChipBar {
  static chips = [
    { id: 'all', labelKey: 'allRecords' },
    { id: 'Prescription', labelKey: 'prescriptions' },
    { id: 'Allergy', labelKey: 'allergies' },
    { id: 'Lab Report', labelKey: 'labReports' },
    { id: 'Diagnosis', labelKey: 'diagnoses' },
    { id: 'Vitals', labelKey: 'vitals' }
  ];

  static render(selectedId = 'all') {
    let html = '<div class="flex gap-2 overflow-x-auto no-scrollbar py-2 px-1">';
    for (const chip of this.chips) {
      const isSelected = chip.id === selectedId;
      const cls = isSelected
        ? 'bg-[var(--patient-accent)] text-white shadow-sm font-semibold'
        : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--surface-2)]';

      html += `
        <button class="filter-chip px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${cls}" data-chip-id="${chip.id}">
          ${I18n.t(chip.labelKey)}
        </button>
      `;
    }
    html += '</div>';
    return html;
  }

  static bindEvents(container, onSelect) {
    container.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-chip-id');
        if (onSelect) onSelect(id);
      });
    });
  }
}

export default ChipBar;
