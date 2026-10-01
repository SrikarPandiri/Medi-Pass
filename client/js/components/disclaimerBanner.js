/**
 * @file client/js/components/disclaimerBanner.js
 * @description Persistent clinical disclaimer banner for AI assistant and patient screens.
 */

import { I18n } from '../shared/i18n.js';

export class DisclaimerBanner {
  static render() {
    return `
      <div class="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-[11px] text-amber-700 dark:text-amber-300 flex items-center justify-between">
        <div class="flex items-center gap-1.5 flex-1 min-w-0">
          <span class="text-sm">ℹ️</span>
          <span class="truncate">${I18n.t('disclaimer')}</span>
        </div>
        <a href="tel:108" class="ml-2 font-bold underline whitespace-nowrap text-amber-800 dark:text-amber-200">108 / 112</a>
      </div>
    `;
  }
}

export default DisclaimerBanner;
