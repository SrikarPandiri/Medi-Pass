/**
 * @file client/js/patient/home.js
 * @description Patient Home view: Instagram-style health story rings, vitals snapshot sparkline cards,
 * filter chips, and interactive clinical feed.
 */

import { Api } from '../shared/api.js';
import { StoryRing } from '../components/storyRing.js';
import { RecordCard } from '../components/recordCard.js';
import { ChipBar } from '../components/chipBar.js';
import { Skeleton } from '../shared/skeleton.js';
import { TTSPlayer } from './tts.js';
import { Router } from '../shared/router.js';

export class PatientHome {
  static records = [];
  static activeCategory = 'all';
  static seenStories = new Set();

  static async render(container, user = {}, onAskAIRecord = null) {
    container.innerHTML = `
      <div class="px-4 py-3 space-y-4 pb-24">
        <!-- Stories Row -->
        <div id="stories-slot">
          ${StoryRing.renderRow(this.seenStories)}
        </div>

        <!-- Health Snapshot Sparkline Cards -->
        <div class="grid grid-cols-2 gap-3">
          <!-- HbA1c Card -->
          <div class="snapshot-card border-l-4 border-l-rose-500">
            <div class="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>HbA1c</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">High</span>
            </div>
            <div class="mt-2 flex items-baseline gap-1">
              <span class="text-2xl font-black text-[var(--text)]">7.8</span>
              <span class="text-xs text-[var(--text-muted)]">%</span>
            </div>
            <p class="text-[10px] text-[var(--text-subtle)] mt-1">Ref: &lt; 5.7% (Monitored)</p>
          </div>

          <!-- Blood Pressure Card -->
          <div class="snapshot-card border-l-4 border-l-amber-500">
            <div class="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Blood Pressure</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">Stage 1</span>
            </div>
            <div class="mt-2 flex items-baseline gap-1">
              <span class="text-2xl font-black text-[var(--text)]">138/86</span>
              <span class="text-xs text-[var(--text-muted)]">mmHg</span>
            </div>
            <p class="text-[10px] text-[var(--text-subtle)] mt-1">Pulse: 74 bpm</p>
          </div>
        </div>

        <!-- Filter Chips -->
        <div id="chips-slot">
          ${ChipBar.render(this.activeCategory)}
        </div>

        <!-- Records Feed Area -->
        <div id="feed-slot">
          ${Skeleton.recordCards(3)}
        </div>
      </div>
    `;

    // Stories click handlers
    container.querySelectorAll('.story-ring-wrapper').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-story-id');
        this.seenStories.add(id);
        StoryRing.openViewer(id, user);
        container.querySelector('#stories-slot').innerHTML = StoryRing.renderRow(this.seenStories);
      });
    });

    // Chip filter handlers
    ChipBar.bindEvents(container.querySelector('#chips-slot'), (selectedId) => {
      this.activeCategory = selectedId;
      container.querySelector('#chips-slot').innerHTML = ChipBar.render(selectedId);
      this.renderFeed(container, onAskAIRecord);
      ChipBar.bindEvents(container.querySelector('#chips-slot'), (id) => {
        this.activeCategory = id;
        this.renderFeed(container, onAskAIRecord);
      });
    });

    // Fetch live records
    try {
      const data = await Api.get('/api/patient/records');
      this.records = data.records || [];
      this.renderFeed(container, onAskAIRecord);
    } catch (err) {
      console.warn('[Home] Failed to fetch records:', err);
    }
  }

  static renderFeed(container, onAskAIRecord) {
    const feedSlot = container.querySelector('#feed-slot');
    if (!feedSlot) return;

    let filtered = this.records;
    if (this.activeCategory !== 'all') {
      filtered = this.records.filter(r => r.record_type === this.activeCategory);
    }

    if (filtered.length === 0) {
      feedSlot.innerHTML = `
        <div class="text-center py-10 bg-[var(--surface-2)] rounded-3xl border border-[var(--border)] border-dashed">
          <p class="text-sm font-semibold text-[var(--text-muted)]">No ${this.activeCategory} records yet.</p>
        </div>
      `;
      return;
    }

    feedSlot.innerHTML = filtered.map(r => RecordCard.render(r)).join('');

    RecordCard.bindEvents(feedSlot, filtered, {
      onReadAloud: (record) => {
        TTSPlayer.speak(`${record.title}. ${JSON.stringify(record.content)}`);
      },
      onAskAI: (record) => {
        if (onAskAIRecord) onAskAIRecord(record);
      }
    });
  }
}

export default PatientHome;
