/**
 * @file client/js/components/sourceChip.js
 * @description Source citation chip component linking AI claims to verified medical records.
 */

export class SourceChip {
  static render(record) {
    return `
      <button class="source-chip-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--patient-accent)] transition shadow-sm" data-id="${record.record_id}">
        <span>📌</span>
        <span class="font-medium">${record.title}</span>
      </button>
    `;
  }
}

export default SourceChip;
