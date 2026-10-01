/**
 * @file client/js/patient/chat/chatPage.js
 * @description Full-screen ChatGPT / Gemini-style AI Assistant screen for patients.
 * Handles streaming answers, voice input/output, suggestion chips, OCR photo upload, and history drawer.
 */

import { Api } from '../../shared/api.js';
import { Toast } from '../../shared/toast.js';
import { I18n } from '../../shared/i18n.js';
import { ChatBubble } from '../../components/chatBubble.js';
import { ChatComposer } from '../../components/chatComposer.js';
import { ChatList } from './chatList.js';
import { QuickPrompts } from './quickPrompts.js';
import { ChatStream } from './chatStream.js';
import { VoiceController } from '../../components/voiceButton.js';
import { TTSPlayer } from '../tts.js';
import { DisclaimerBanner } from '../../components/disclaimerBanner.js';
import { BottomSheet } from '../../shared/sheet.js';

export class ChatPage {
  static currentThread = null;
  static threads = [];
  static messages = [];
  static isStreaming = false;
  static voiceController = null;

  static async render(container, user = {}, initialAttachedRecord = null) {
    const lang = I18n.currentLanguage || 'en';

    container.innerHTML = `
      <div class="flex flex-col h-full bg-[var(--bg)] relative overflow-hidden">
        <!-- Top Sticky Header -->
        <header class="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between shadow-sm">
          <div class="flex items-center gap-2">
            <button id="btn-toggle-drawer" class="p-1.5 rounded-xl hover:bg-[var(--surface-2)] text-[var(--text-muted)]" title="History Drawer">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
            </button>
            <div class="ai-avatar text-sm">✨</div>
            <div>
              <h2 class="font-bold text-sm text-[var(--text)]">MediPass Assistant</h2>
              <p class="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">Grounded in your records</p>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <!-- Language Selector -->
            <select id="chat-lang-picker" class="bg-[var(--surface-2)] text-[var(--text)] text-xs font-semibold px-2 py-1 rounded-xl border border-[var(--border)] outline-none">
              <option value="en" ${lang === 'en' ? 'selected' : ''}>EN</option>
              <option value="te" ${lang === 'te' ? 'selected' : ''}>తెలుగు</option>
              <option value="hi" ${lang === 'hi' ? 'selected' : ''}>हिन्दी</option>
              <option value="ta" ${lang === 'ta' ? 'selected' : ''}>தமிழ்</option>
              <option value="kn" ${lang === 'kn' ? 'selected' : ''}>ಕನ್ನಡ</option>
            </select>

            <!-- New Chat -->
            <button id="btn-new-chat" class="p-1.5 rounded-xl hover:bg-[var(--surface-2)] text-[var(--text-muted)]" title="Start New Conversation">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
          </div>
        </header>

        <!-- Persistent Disclaimer -->
        ${DisclaimerBanner.render()}

        <!-- Left Conversation Drawer -->
        <div id="chat-drawer-backdrop" class="chat-drawer-backdrop"></div>
        <aside id="chat-drawer" class="chat-drawer"></aside>

        <!-- Messages Area -->
        <div id="chat-messages-container" class="chat-container flex-1">
          <!-- Dynamic messages or Empty State with Suggestion Chips -->
        </div>

        <!-- Composer -->
        ${ChatComposer.render()}
      </div>
    `;

    // Initialize Voice Controller
    const indicator = container.querySelector('#composer-voice-indicator');
    const textarea = container.querySelector('#chat-input-textarea');

    this.voiceController = new VoiceController({
      onResult: (transcript, isFinal) => {
        if (textarea) textarea.value = transcript;
      },
      onStart: () => {
        if (indicator) indicator.classList.remove('hidden');
        if (indicator) indicator.classList.add('flex');
      },
      onEnd: () => {
        if (indicator) indicator.classList.add('hidden');
        if (indicator) indicator.classList.remove('flex');
      },
      onError: (err) => {
        if (indicator) indicator.classList.add('hidden');
        Toast.warning('Voice recognition notice: ' + err);
      }
    });

    container.querySelector('#cancel-voice-btn')?.addEventListener('click', () => {
      this.voiceController.stop();
    });

    // Language Change
    container.querySelector('#chat-lang-picker')?.addEventListener('change', (e) => {
      I18n.setLanguage(e.target.value);
      this.renderMessagesList(container, user);
    });

    // Load or create active thread
    await this.initThreads(container, user);

    // Bind composer events
    ChatComposer.bindEvents(container, {
      onSend: (text) => this.sendMessage(container, user, text),
      onVoiceToggle: () => {
        if (this.voiceController.isRecording) {
          this.voiceController.stop();
        } else {
          this.voiceController.start(I18n.currentLanguage);
        }
      },
      onOcrAttach: (file) => this.handleOcrPhotoUpload(container, user, file)
    });

    // History Drawer Events
    const drawer = container.querySelector('#chat-drawer');
    const backdrop = container.querySelector('#chat-drawer-backdrop');
    const toggleDrawer = () => {
      drawer?.classList.toggle('open');
      backdrop?.classList.toggle('open');
    };

    container.querySelector('#btn-toggle-drawer')?.addEventListener('click', toggleDrawer);
    backdrop?.addEventListener('click', toggleDrawer);
    container.querySelector('#btn-new-chat')?.addEventListener('click', async () => {
      await this.createNewThread(container, user);
    });

    // If navigated with attached record ("Ask AI about this")
    if (initialAttachedRecord) {
      const prompt = `Please review my record "${initialAttachedRecord.title}" and explain what this means for my health.`;
      setTimeout(() => this.sendMessage(container, user, prompt), 300);
    }
  }

  static async initThreads(container, user) {
    try {
      const data = await Api.get('/api/chat/threads');
      this.threads = data.threads || [];

      if (this.threads.length > 0) {
        this.currentThread = this.threads[0];
      } else {
        const newTh = await Api.post('/api/chat/threads', {
          title: 'Health Conversation',
          language: I18n.currentLanguage
        });
        this.currentThread = newTh.thread;
        this.threads = [this.currentThread];
      }

      await this.loadMessages(container, user);
      this.renderDrawer(container, user);
    } catch (err) {
      console.warn('[Chat] Failed to init threads:', err);
    }
  }

  static async loadMessages(container, user) {
    if (!this.currentThread) return;
    try {
      const data = await Api.get(`/api/chat/threads/${this.currentThread.thread_id}/messages`);
      this.messages = data.messages || [];
      this.renderMessagesList(container, user);
    } catch (err) {
      console.warn('[Chat] Failed to load messages:', err);
    }
  }

  static renderDrawer(container, user) {
    const drawer = container.querySelector('#chat-drawer');
    if (!drawer) return;

    drawer.innerHTML = ChatList.renderDrawer(this.threads, this.currentThread?.thread_id);

    drawer.querySelector('#btn-new-chat-drawer')?.addEventListener('click', async () => {
      drawer.classList.remove('open');
      container.querySelector('#chat-drawer-backdrop')?.classList.remove('open');
      await this.createNewThread(container, user);
    });

    drawer.querySelectorAll('.thread-item').forEach(el => {
      el.addEventListener('click', async () => {
        const id = el.getAttribute('data-thread-id');
        this.currentThread = this.threads.find(t => t.thread_id === id);
        drawer.classList.remove('open');
        container.querySelector('#chat-drawer-backdrop')?.classList.remove('open');
        await this.loadMessages(container, user);
      });
    });

    drawer.querySelectorAll('.btn-del-thread').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-thread-id');
        await Api.delete(`/api/chat/threads/${id}`);
        this.threads = this.threads.filter(t => t.thread_id !== id);
        if (this.currentThread?.thread_id === id) {
          this.currentThread = this.threads[0] || null;
        }
        this.renderDrawer(container, user);
        if (this.currentThread) {
          await this.loadMessages(container, user);
        } else {
          await this.createNewThread(container, user);
        }
      });
    });
  }

  static async createNewThread(container, user) {
    try {
      const newTh = await Api.post('/api/chat/threads', {
        title: 'New Consultation',
        language: I18n.currentLanguage
      });
      this.currentThread = newTh.thread;
      this.threads.unshift(this.currentThread);
      this.messages = [];
      this.renderMessagesList(container, user);
      this.renderDrawer(container, user);
    } catch (e) {
      Toast.error('Could not create new chat.');
    }
  }

  static renderMessagesList(container, user) {
    const msgContainer = container.querySelector('#chat-messages-container');
    if (!msgContainer) return;

    if (this.messages.length === 0) {
      const lang = I18n.currentLanguage || 'en';
      const name = user.name ? user.name.split(' ')[0] : 'there';
      const quickPrompts = QuickPrompts.getPrompts(name, lang);

      msgContainer.innerHTML = `
        <div class="my-auto py-8 text-center space-y-4">
          <div class="ai-avatar w-14 h-14 mx-auto text-2xl">✨</div>
          <div>
            <h3 class="font-extrabold text-lg text-[var(--text)]">Hi ${name} 👋</h3>
            <p class="text-xs text-[var(--text-muted)] mt-1 max-w-xs mx-auto">
              I can explain your lab numbers, review medication schedules, and check for drug allergy conflicts.
            </p>
          </div>

          <div class="pt-4 flex flex-col gap-2 max-w-sm mx-auto text-left">
            <p class="text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">Suggested Questions</p>
            <div class="flex flex-wrap gap-2">
              ${quickPrompts.map(p => `
                <button class="quick-chip suggestion-chip flex items-center gap-1.5" data-prompt="${p.text}">
                  <span>${p.icon}</span>
                  <span>${p.text}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      msgContainer.querySelectorAll('.quick-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          const prompt = btn.getAttribute('data-prompt');
          this.sendMessage(container, user, prompt);
        });
      });
      return;
    }

    let html = '';
    for (const msg of this.messages) {
      html += ChatBubble.render(msg);
    }
    msgContainer.innerHTML = html;

    ChatBubble.bindEvents(msgContainer, {
      onSourceClick: (recordId) => {
        Toast.info(`Inspect record: ${recordId}`);
      },
      onListen: (text, lang) => {
        TTSPlayer.speak(text, lang);
      },
      onFeedback: async (msgId, rating) => {
        try {
          await Api.post(`/api/chat/messages/${msgId}/feedback`, { feedback: rating });
          Toast.success('Thank you for your feedback');
        } catch (e) {}
      }
    });

    // Scroll to bottom
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  static async sendMessage(container, user, text) {
    if (this.isStreaming || !this.currentThread) return;
    this.isStreaming = true;

    const msgContainer = container.querySelector('#chat-messages-container');

    // Optimistically append user message
    const tempUserMsg = {
      message_id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };
    this.messages.push(tempUserMsg);
    this.renderMessagesList(container, user);

    // Prepare assistant streaming placeholder
    const assistantBubbleWrapper = document.createElement('div');
    assistantBubbleWrapper.className = 'chat-bubble-assistant animate-fade-in';
    assistantBubbleWrapper.innerHTML = `
      <div class="flex items-center gap-2 mb-2 pb-1.5 border-b border-[var(--border)]">
        <div class="ai-avatar text-xs font-bold">✨</div>
        <span class="font-bold text-xs text-[var(--text)]">MediPass Assistant</span>
      </div>
      <div class="message-content text-sm leading-relaxed space-y-2 streaming-cursor" id="streaming-text-slot">
      </div>
    `;
    msgContainer.appendChild(assistantBubbleWrapper);
    msgContainer.scrollTop = msgContainer.scrollHeight;

    const textSlot = assistantBubbleWrapper.querySelector('#streaming-text-slot');
    let streamAccumulator = '';

    await ChatStream.sendAndStream({
      threadId: this.currentThread.thread_id,
      text,
      inputMode: 'text',
      language: I18n.currentLanguage || 'en',
      onChunk: (chunk) => {
        streamAccumulator += chunk;
        if (textSlot) {
          textSlot.innerHTML = ChatBubble.renderMarkdown(streamAccumulator);
          msgContainer.scrollTop = msgContainer.scrollHeight;
        }
      },
      onDone: (finalMessage) => {
        this.isStreaming = false;
        this.messages.push(finalMessage);
        this.renderMessagesList(container, user);
      },
      onError: (err) => {
        this.isStreaming = false;
        Toast.error(err.message || 'Stream disconnected');
        this.renderMessagesList(container, user);
      }
    });
  }

  static async handleOcrPhotoUpload(container, user, file) {
    Toast.info('Analyzing prescription image with AI vision...');
    try {
      const formData = new FormData();
      formData.append('image', file);

      const data = await Api.post('/api/ocr/extract', formData);
      const ext = data.extracted_data;

      const summaryPrompt = `I have attached an uploaded prescription from "${ext.patient_name || 'clinic'}". Diagnosed: "${ext.diagnosis || ''}". Medications: ${JSON.stringify(ext.medications || [])}. Doctor note: "${ext.doctor_notes || ''}". Please explain this prescription to me in simple terms.`;

      await this.sendMessage(container, user, summaryPrompt);
    } catch (err) {
      Toast.error('OCR processing failed: ' + err.message);
    }
  }
}

export default ChatPage;
