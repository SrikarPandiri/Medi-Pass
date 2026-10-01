/**
 * @file client/js/components/emptyState.js
 * @description Friendly empty state placeholder with clean call to action.
 */

export class EmptyState {
  static render({ icon = '📂', title = 'No records found', message = 'New health records will appear here.', actionText = null, actionId = null }) {
    return `
      <div class="flex flex-col items-center justify-center p-8 text-center my-6 bg-[var(--surface-2)] rounded-3xl border border-[var(--border)] border-dashed">
        <div class="text-4xl mb-3">${icon}</div>
        <h3 class="font-bold text-base text-[var(--text)] mb-1">${title}</h3>
        <p class="text-xs text-[var(--text-muted)] max-w-xs mb-4 leading-relaxed">${message}</p>
        ${actionText ? `<button id="${actionId}" class="px-4 py-2 rounded-xl bg-[var(--patient-accent)] text-white text-xs font-semibold shadow hover:opacity-95 transition">${actionText}</button>` : ''}
      </div>
    `;
  }
}

export default EmptyState;
