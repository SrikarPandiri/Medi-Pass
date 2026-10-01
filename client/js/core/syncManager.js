/**
 * @file client/js/core/syncManager.js
 * @description Optimistic offline synchronization manager: enqueues offline doctor prescriptions,
 * listens to network status transitions, and syncs queued items with idempotency guarantees.
 */

import { LocalDB } from './idb.js';

export class SyncManager {
  static isOnline = navigator.onLine;
  static listeners = new Set();
  static isSyncing = false;

  static init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.flushQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });

    // Periodic heartbeat sync check every 25 seconds
    setInterval(() => {
      if (this.isOnline) {
        this.flushQueue();
      }
    }, 25000);
  }

  static subscribe(fn) {
    this.listeners.add(fn);
    fn(this.isOnline);
    return () => this.listeners.delete(fn);
  }

  static notifyListeners() {
    for (const fn of this.listeners) {
      fn(this.isOnline);
    }
  }

  /**
   * Enqueues an action optimistically to IndexedDB
   */
  static async enqueue(action, data) {
    const queueItem = {
      action,
      data,
      created_at: new Date().toISOString(),
      status: 'PENDING_SYNC'
    };

    const id = await LocalDB.put('pending_queue', queueItem);
    if (this.isOnline) {
      this.flushQueue();
    }
    return id;
  }

  /**
   * Flushes pending queue to server endpoint /api/sync
   */
  static async flushQueue() {
    if (this.isSyncing || !this.isOnline) return;
    this.isSyncing = true;

    try {
      const items = await LocalDB.getAll('pending_queue');
      if (!items || items.length === 0) {
        this.isSyncing = false;
        return;
      }

      const syncPayload = {
        idempotencyKey: `sync-${Date.now()}-${items.length}`,
        items: items.map(i => ({
          id: i.id,
          action: i.action,
          record: i.data
        }))
      };

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncPayload)
      });

      if (res.ok) {
        await LocalDB.clear('pending_queue');
        console.log(`[SyncManager] Successfully flushed ${items.length} queued items.`);
      }
    } catch (err) {
      console.warn('[SyncManager] Flush queue retry later:', err.message);
    } finally {
      this.isSyncing = false;
    }
  }
}

SyncManager.init();
export default SyncManager;
