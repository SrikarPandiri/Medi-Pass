/**
 * @file client/js/patient/chat/chatStore.js
 * @description Local IndexedDB caching and synchronization for AI chat threads and messages.
 */

import { LocalDB } from '../../core/idb.js';

export class ChatStore {
  static async saveThreadLocally(thread) {
    return LocalDB.put('chat_cache', thread);
  }

  static async getLocalThreads() {
    return LocalDB.getAll('chat_cache');
  }

  static async clearLocalThreads() {
    return LocalDB.clear('chat_cache');
  }
}

export default ChatStore;
