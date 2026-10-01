/**
 * @file client/js/shared/skeleton.js
 * @description Fast skeleton loading templates rendered within 100ms of navigation.
 */

export class Skeleton {
  static recordCards(count = 3) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm animate-pulse mb-3">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            <div class="flex-1 space-y-1.5">
              <div class="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
              <div class="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            </div>
            <div class="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          </div>
          <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-4"></div>
          <div class="flex gap-2 pt-2 border-t border-[var(--border)]">
            <div class="h-7 bg-slate-200 dark:bg-slate-800 rounded-xl w-24"></div>
            <div class="h-7 bg-slate-200 dark:bg-slate-800 rounded-xl w-32"></div>
          </div>
        </div>
      `;
    }
    return html;
  }

  static stories(count = 5) {
    let html = '<div class="flex gap-3 overflow-x-auto pb-2">';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="flex flex-col items-center gap-1.5 flex-shrink-0 animate-pulse">
          <div class="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          <div class="w-10 h-2 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      `;
    }
    html += '</div>';
    return html;
  }
}

export default Skeleton;
