/**
 * @file client/js/shared/sheet.js
 * @description Mobile-first Bottom Sheet manager with smooth transitions and backdrop.
 */

export class BottomSheet {
  static open({ title, contentHtml, onRender = null, onClose = null }) {
    this.close(); // Close any currently open sheet

    const backdrop = document.createElement('div');
    backdrop.id = 'bottom-sheet-backdrop';
    backdrop.className = 'fixed inset-0 bg-black/60 z-[120] transition-opacity duration-200 opacity-0';

    const sheet = document.createElement('div');
    sheet.id = 'bottom-sheet-container';
    sheet.className = 'fixed inset-x-0 bottom-0 max-h-[88vh] bg-[var(--surface)] text-[var(--text)] rounded-t-3xl shadow-2xl z-[130] flex flex-col transform translate-y-full transition-transform duration-250 ease-out border-t border-[var(--border)]';

    sheet.innerHTML = `
      <div class="w-full flex flex-col items-center pt-3 pb-1 cursor-grab">
        <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
      </div>
      <div class="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <h3 class="font-bold text-lg text-[var(--text)]">${title || ''}</h3>
        <button id="close-sheet-btn" class="p-1 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="p-5 overflow-y-auto max-h-[calc(88vh-80px)]" id="sheet-body">
        ${contentHtml || ''}
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);

    // Trigger animation
    requestAnimationFrame(() => {
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-100');
      sheet.classList.remove('translate-y-full');
      sheet.classList.add('translate-y-0');
    });

    const closeHandler = () => {
      backdrop.classList.remove('opacity-100');
      backdrop.classList.add('opacity-0');
      sheet.classList.remove('translate-y-0');
      sheet.classList.add('translate-y-full');
      setTimeout(() => {
        backdrop.remove();
        sheet.remove();
        if (onClose) onClose();
      }, 250);
    };

    backdrop.addEventListener('click', closeHandler);
    sheet.querySelector('#close-sheet-btn').addEventListener('click', closeHandler);

    if (onRender) {
      onRender(sheet.querySelector('#sheet-body'), closeHandler);
    }

    return { close: closeHandler };
  }

  static close() {
    const backdrop = document.getElementById('bottom-sheet-backdrop');
    const sheet = document.getElementById('bottom-sheet-container');
    if (backdrop) backdrop.remove();
    if (sheet) sheet.remove();
  }
}

export default BottomSheet;
