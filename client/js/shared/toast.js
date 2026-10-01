/**
 * @file client/js/shared/toast.js
 * @description Toast notification utility for user feedback.
 */

export class Toast {
  static show(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-11/12 max-w-sm pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colorMap = {
      success: 'bg-emerald-600 text-white border-emerald-500',
      error: 'bg-rose-600 text-white border-rose-500',
      warning: 'bg-amber-500 text-white border-amber-400',
      info: 'bg-slate-800 text-white border-slate-700'
    };

    const cls = colorMap[type] || colorMap.info;
    toast.className = `${cls} px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium flex items-center justify-between pointer-events-auto transform transition-all duration-200 animate-fade-in`;
    toast.innerHTML = `
      <span>${message}</span>
      <button class="ml-3 opacity-75 hover:opacity-100 font-bold">&times;</button>
    `;

    toast.querySelector('button').addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }

  static success(msg) { this.show(msg, 'success'); }
  static error(msg) { this.show(msg, 'error'); }
  static warning(msg) { this.show(msg, 'warning'); }
  static info(msg) { this.show(msg, 'info'); }
}

export default Toast;
