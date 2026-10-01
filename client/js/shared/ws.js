/**
 * @file client/js/shared/ws.js
 * @description WebSocket client managing live session subscriptions, real-time audit updates,
 * and immediate screen-blanking kill-switch signals.
 */

import { Api } from './api.js';

export class WsClient {
  static socket = null;
  static eventHandlers = new Map(); // event -> Set<callback>
  static reconnectTimeout = null;

  static connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = Api.getAuthToken();
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[WS] Connected to MediPass live hub.');
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.dispatch(data.event || data.type, data);
        } catch (e) {
          console.error('[WS] Failed to parse message:', e);
        }
      };

      this.socket.onclose = () => {
        console.log('[WS] Disconnected, scheduling reconnect...');
        this.reconnectTimeout = setTimeout(() => this.connect(), 4000);
      };

      this.socket.onerror = (err) => {
        console.warn('[WS] Error:', err);
      };
    } catch (err) {
      console.warn('[WS] Connection exception:', err);
    }
  }

  static on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(callback);
    return () => this.eventHandlers.get(event).delete(callback);
  }

  static dispatch(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const fn of handlers) {
        fn(data);
      }
    }
  }

  static subscribeSession(sessionId) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        action: 'SUBSCRIBE_SESSION',
        session_id: sessionId
      }));
    }
  }
}

export default WsClient;
