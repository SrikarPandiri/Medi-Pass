/**
 * @file client/js/components/languagePicker.js
 * @description Language selector component for 5 regional languages.
 */

import { I18n } from '../shared/i18n.js';

export class LanguagePicker {
  static languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' }
  ];

  static render(selectedCode = 'en') {
    return `
      <select id="app-language-select" class="bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] rounded-xl px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer">
        ${this.languages.map(l => `
          <option value="${l.code}" ${l.code === selectedCode ? 'selected' : ''}>
            ${l.native} (${l.name})
          </option>
        `).join('')}
      </select>
    `;
  }

  static bindEvents(container, onChange) {
    const select = container.querySelector('#app-language-select');
    select?.addEventListener('change', (e) => {
      const code = e.target.value;
      I18n.setLanguage(code);
      if (onChange) onChange(code);
    });
  }
}

export default LanguagePicker;
