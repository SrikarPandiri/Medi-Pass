/**
 * @file client/js/components/chatBubble.js
 * @description AI chat bubble component with markdown rendering, source chips,
 * text-to-speech audio reader, and multi-lingual translation toggle.
 */

import { I18n } from '../shared/i18n.js';
import { Api } from '../shared/api.js';
import { Toast } from '../shared/toast.js';

export class ChatBubble {
  static render(message, { onSourceClick = null, onListen = null, onTranslate = null, onFeedback = null } = {}) {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';

    if (isUser) {
      return `
        <div class="chat-bubble-user animate-fade-in" data-message-id="${message.message_id}">
          <p class="whitespace-pre-wrap">${this.escapeHtml(message.content)}</p>
          <span class="text-[9px] opacity-75 mt-1 block text-right">
            ${message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
      `;
    }

    // Assistant Bubble
    const renderedMarkdown = this.renderMarkdown(message.content);
    const hasEmergency = message.flags && message.flags.includes('emergency');

    // Source chips
    let sourcesHtml = '';
    if (message.sources && message.sources.length > 0) {
      sourcesHtml = `
        <div class="mt-2.5 pt-2 border-t border-[var(--border)] flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <span class="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Based on:</span>
          ${message.sources.map(sId => `
            <button class="source-chip px-2 py-0.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] text-[11px] flex items-center gap-1 transition" data-source-id="${sId}">
              <span>📄</span>
              <span>Record ${sId.slice(-4)}</span>
            </button>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="chat-bubble-assistant animate-fade-in ${hasEmergency ? 'border-2 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' : ''}" data-message-id="${message.message_id}">
        <!-- Header -->
        <div class="flex items-center gap-2 mb-2 pb-1.5 border-b border-[var(--border)]">
          <div class="ai-avatar text-xs font-bold">✨</div>
          <span class="font-bold text-xs text-[var(--text)]">MediPass Assistant</span>
          <span class="text-[10px] text-[var(--text-subtle)] ml-auto">
            ${message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>

        <!-- Markdown Content -->
        <div class="message-content text-sm leading-relaxed space-y-2">
          ${renderedMarkdown}
        </div>

        <!-- Translated text preview slot -->
        <div class="translation-preview-slot hidden mt-2.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-[var(--text)]">
        </div>

        ${sourcesHtml}

        <!-- Action Row -->
        <div class="flex items-center justify-between pt-2.5 mt-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
          <div class="flex items-center gap-1.5">
            <!-- 🔊 Listen -->
            <button class="btn-listen p-1.5 rounded-lg hover:bg-[var(--surface-2)] flex items-center gap-1" title="Read Aloud">
              <span>🔊</span>
              <span class="text-[11px]">Listen</span>
            </button>

            <!-- 🌐 Listen In... -->
            <div class="relative group">
              <button class="btn-translate-lang p-1.5 rounded-lg hover:bg-[var(--surface-2)] flex items-center gap-1" title="Translate & Listen in another language">
                <span>🌐</span>
                <span class="text-[11px]">Listen in...</span>
              </button>
              <div class="lang-dropdown hidden absolute bottom-full left-0 mb-1 bg-[var(--surface)] border border-[var(--border)] shadow-xl rounded-xl p-1 z-30 w-32 flex-col gap-0.5">
                <button class="lang-opt text-left px-2 py-1 rounded text-xs hover:bg-[var(--surface-2)]" data-lang="te">తెలుగు (Telugu)</button>
                <button class="lang-opt text-left px-2 py-1 rounded text-xs hover:bg-[var(--surface-2)]" data-lang="hi">हिन्दी (Hindi)</button>
                <button class="lang-opt text-left px-2 py-1 rounded text-xs hover:bg-[var(--surface-2)]" data-lang="ta">தமிழ் (Tamil)</button>
                <button class="lang-opt text-left px-2 py-1 rounded text-xs hover:bg-[var(--surface-2)]" data-lang="kn">ಕನ್ನಡ (Kannada)</button>
                <button class="lang-opt text-left px-2 py-1 rounded text-xs hover:bg-[var(--surface-2)]" data-lang="en">English</button>
              </div>
            </div>

            <!-- Copy -->
            <button class="btn-copy p-1.5 rounded-lg hover:bg-[var(--surface-2)]" title="Copy text">
              <span>📋</span>
            </button>
          </div>

          <!-- Feedback Up/Down -->
          <div class="flex items-center gap-1">
            <button class="btn-thumb-up p-1 rounded hover:bg-[var(--surface-2)] ${message.feedback === 'up' ? 'text-teal-600' : ''}" title="Helpful">👍</button>
            <button class="btn-thumb-down p-1 rounded hover:bg-[var(--surface-2)] ${message.feedback === 'down' ? 'text-rose-600' : ''}" title="Not helpful">👎</button>
          </div>
        </div>
      </div>
    `;
  }

  static bindEvents(container, { onSourceClick, onListen, onTranslate, onFeedback }) {
    container.querySelectorAll('.chat-bubble-assistant').forEach(el => {
      const msgId = el.getAttribute('data-message-id');
      const textContent = el.querySelector('.message-content')?.innerText || '';

      // Copy Button
      el.querySelector('.btn-copy')?.addEventListener('click', () => {
        navigator.clipboard.writeText(textContent);
        Toast.success('Copied to clipboard');
      });

      // Listen Button (SpeechSynthesis)
      el.querySelector('.btn-listen')?.addEventListener('click', () => {
        if (onListen) onListen(textContent, 'en');
      });

      // Translate Dropdown
      const transBtn = el.querySelector('.btn-translate-lang');
      const dropdown = el.querySelector('.lang-dropdown');
      transBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown?.classList.toggle('hidden');
        dropdown?.classList.toggle('flex');
      });

      el.querySelectorAll('.lang-opt').forEach(opt => {
        opt.addEventListener('click', async (e) => {
          e.stopPropagation();
          dropdown?.classList.add('hidden');
          dropdown?.classList.remove('flex');
          const targetLang = opt.getAttribute('data-lang');

          try {
            const res = await Api.post('/api/chat/translate', { text: textContent, target_lang: targetLang });
            const slot = el.querySelector('.translation-preview-slot');
            if (slot) {
              slot.classList.remove('hidden');
              slot.innerHTML = `
                <div class="font-bold mb-1 flex items-center justify-between text-purple-700 dark:text-purple-300">
                  <span>Translation (${targetLang.toUpperCase()}):</span>
                  <button class="btn-listen-trans text-xs underline">🔊 Listen Aloud</button>
                </div>
                <p class="leading-relaxed">${res.translated}</p>
              `;

              slot.querySelector('.btn-listen-trans')?.addEventListener('click', () => {
                if (onListen) onListen(res.translated, targetLang);
              });
            }

            if (onListen) onListen(res.translated, targetLang);
          } catch (err) {
            Toast.error('Translation failed: ' + err.message);
          }
        });
      });

      // Feedback
      el.querySelector('.btn-thumb-up')?.addEventListener('click', () => {
        if (onFeedback) onFeedback(msgId, 'up');
      });
      el.querySelector('.btn-thumb-down')?.addEventListener('click', () => {
        if (onFeedback) onFeedback(msgId, 'down');
      });

      // Source Chips
      el.querySelectorAll('.source-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const sId = chip.getAttribute('data-source-id');
          if (onSourceClick) onSourceClick(sId);
        });
      });
    });
  }

  static renderMarkdown(text) {
    if (window.marked && window.DOMPurify) {
      return window.DOMPurify.sanitize(window.marked.parse(text));
    }
    // Safe basic formatting fallback
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  }

  static escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }
}

export default ChatBubble;
