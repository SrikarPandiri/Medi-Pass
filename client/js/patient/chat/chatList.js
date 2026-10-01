/**
 * @file client/js/patient/chat/chatList.js
 * @description Conversation drawer managing historical chat threads with rename and archive actions.
 */

export class ChatList {
  static renderDrawer(threads = [], activeThreadId = null) {
    return `
      <div class="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h3 class="font-bold text-base text-[var(--text)]">Conversations</h3>
        <button id="btn-new-chat-drawer" class="px-3 py-1.5 rounded-xl bg-[var(--patient-accent)] text-white text-xs font-semibold shadow hover:opacity-95 transition">
          + New Chat
        </button>
      </div>
      <div class="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
        ${threads.length === 0 ? '<p class="text-xs text-[var(--text-muted)] p-4 text-center">No past conversations.</p>' : ''}
        ${threads.map(t => {
          const isAct = t.thread_id === activeThreadId;
          return `
            <div class="thread-item flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${isAct ? 'bg-[var(--patient-accent-light)] text-[var(--patient-accent)] font-semibold' : 'hover:bg-[var(--surface-2)] text-[var(--text)]'}" data-thread-id="${t.thread_id}">
              <div class="flex items-center gap-2 truncate">
                <span>💬</span>
                <span class="text-xs truncate">${t.title || 'Conversation'}</span>
              </div>
              <button class="btn-del-thread text-[var(--text-muted)] hover:text-rose-500 text-xs p-1" data-thread-id="${t.thread_id}">
                &times;
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

export default ChatList;
