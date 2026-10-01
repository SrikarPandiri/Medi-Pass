/**
 * @file client/js/patient/records.js
 * @description Dedicated records repository view with instant search, category filtering,
 * and bulk "Read Aloud" narration for prescriptions and allergies.
 */

import { Api } from '../shared/api.js';
import { RecordCard } from '../components/recordCard.js';
import { ChipBar } from '../components/chipBar.js';
import { TTSPlayer } from './tts.js';
import { Skeleton } from '../shared/skeleton.js';

export class PatientRecords {
  static records = [];
  static activeCategory = 'all';
  static searchQuery = '';

  static async render(container, onAskAIRecord = null) {
    container.innerHTML = `
      <div class="px-4 py-3 space-y-3 pb-24">
        <!-- Search & Narration Header -->
        <div class="flex items-center gap-2">
          <div class="flex-1 relative">
            <input
              type="text"
              id="records-search-input"
              placeholder="Search records, medicines, tests..."
              class="w-full bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] rounded-2xl px-4 py-2.5 text-xs outline-none focus:border-[var(--patient-accent)] transition"
            />
          </div>
          <button id="btn-narrate-all" class="px-3 py-2.5 rounded-2xl bg-teal-600 text-white text-xs font-semibold shadow hover:bg-teal-700 transition flex items-center gap-1.5 flex-shrink-0" title="Read Critical Allergies & Prescriptions Aloud">
            <span>🔊</span>
            <span>Narrate</span>
          </button>
        </div>

        <!-- Filter Chips -->
        <div id="records-chips-slot">
          ${ChipBar.render(this.activeCategory)}
        </div>

        <!-- List -->
        <div id="records-list-slot">
          ${Skeleton.recordCards(4)}
        </div>
      </div>
    `;

    // Search event
    container.querySelector('#records-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderList(container, onAskAIRecord);
    });

    // Narrate all event
    container.querySelector('#btn-narrate-all')?.addEventListener('click', () => {
      TTSPlayer.readRecordsAloud(this.records);
    });

    // Chip filter events
    ChipBar.bindEvents(container.querySelector('#records-chips-slot'), (id) => {
      this.activeCategory = id;
      container.querySelector('#records-chips-slot').innerHTML = ChipBar.render(id);
      this.renderList(container, onAskAIRecord);
      ChipBar.bindEvents(container.querySelector('#records-chips-slot'), (subId) => {
        this.activeCategory = subId;
        this.renderList(container, onAskAIRecord);
      });
    });

    // Fetch records
    try {
      const data = await Api.get('/api/patient/records');
      this.records = data.records || [];
      this.renderList(container, onAskAIRecord);
    } catch (err) {
      console.warn('Failed to load records:', err);
    }
  }

  static renderList(container, onAskAIRecord) {
    const slot = container.querySelector('#records-list-slot');
    if (!slot) return;

    let filtered = this.records;
    if (this.activeCategory !== 'all') {
      filtered = filtered.filter(r => r.record_type === this.activeCategory);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(this.searchQuery) ||
        JSON.stringify(r.content).toLowerCase().includes(this.searchQuery)
      );
    }

    if (filtered.length === 0) {
      slot.innerHTML = `
        <div class="text-center py-12 text-[var(--text-muted)] text-sm">
          No records matching your search.
        </div>
      `;
      return;
    }

    slot.innerHTML = filtered.map(r => RecordCard.render(r)).join('');

    RecordCard.bindEvents(slot, filtered, {
      onReadAloud: (record) => {
        TTSPlayer.speak(`${record.title}. ${JSON.stringify(record.content)}`);
      },
      onAskAI: (record) => {
        if (onAskAIRecord) onAskAIRecord(record);
      }
    });
  }
}

export default PatientRecords;
