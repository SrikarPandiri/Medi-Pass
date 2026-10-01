/**
 * @file client/js/components/chatComposer.js
 * @description Bottom composer bar for AI Assistant with auto-growing textarea,
 * voice recognition mic button, camera attachment for OCR, and submit control.
 */

import { I18n } from '../shared/i18n.js';

export class ChatComposer {
  static render() {
    return `
      <div class="fixed bottom-16 inset-x-0 bg-[var(--surface)] border-t border-[var(--border)] p-3 z-40 max-w-lg mx-auto shadow-lg">
        <!-- Voice Waveform Indicator (shown during active speech recognition) -->
        <div id="composer-voice-indicator" class="hidden mb-2 items-center justify-between px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300">
          <div class="flex items-center gap-2">
            <div class="voice-waveform">
              <span class="waveform-bar"></span>
              <span class="waveform-bar"></span>
              <span class="waveform-bar"></span>
              <span class="waveform-bar"></span>
              <span class="waveform-bar"></span>
            </div>
            <span class="font-semibold">${I18n.t('speakNow')}</span>
          </div>
          <button id="cancel-voice-btn" class="text-rose-500 font-bold hover:underline">Cancel</button>
        </div>

        <div class="flex items-end gap-2">
          <!-- Attach Photo for OCR -->
          <button id="btn-attach-report" type="button" class="p-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--border)] transition flex-shrink-0" title="Attach prescription/report photo for AI OCR">
            <span>📷</span>
          </button>
          <input type="file" id="file-input-chat-ocr" accept="image/*" class="hidden" />

          <!-- Auto-growing Textarea -->
          <div class="flex-1 relative bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl focus-within:border-[var(--patient-accent)] transition">
            <textarea
              id="chat-input-textarea"
              rows="1"
              placeholder="${I18n.t('typeMessage')}"
              class="w-full bg-transparent px-3.5 py-2.5 text-sm text-[var(--text)] outline-none resize-none max-h-32 leading-relaxed"
            ></textarea>
          </div>

          <!-- Mic Voice Button -->
          <button id="btn-voice-input" type="button" class="p-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--border)] transition flex-shrink-0" title="Voice Input (Speech-to-Text)">
            <span>🎤</span>
          </button>

          <!-- Send Button -->
          <button id="btn-chat-send" type="button" class="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-teal-500 text-white font-bold shadow-md shadow-purple-600/30 hover:opacity-95 transition flex-shrink-0 disabled:opacity-50" title="Send">
            <svg class="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </div>
      </div>
    `;
  }

  static bindEvents(container, { onSend, onVoiceToggle, onOcrAttach }) {
    const textarea = container.querySelector('#chat-input-textarea');
    const sendBtn = container.querySelector('#btn-chat-send');
    const attachBtn = container.querySelector('#btn-attach-report');
    const fileInput = container.querySelector('#file-input-chat-ocr');
    const voiceBtn = container.querySelector('#btn-voice-input');

    // Auto-grow textarea
    textarea?.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    });

    textarea?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn?.click();
      }
    });

    sendBtn?.addEventListener('click', () => {
      const text = textarea?.value?.trim();
      if (!text) return;
      textarea.value = '';
      textarea.style.height = 'auto';
      if (onSend) onSend(text);
    });

    attachBtn?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file && onOcrAttach) {
        onOcrAttach(file);
      }
    });

    voiceBtn?.addEventListener('click', () => {
      if (onVoiceToggle) onVoiceToggle();
    });
  }
}

export default ChatComposer;
