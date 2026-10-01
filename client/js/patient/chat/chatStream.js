/**
 * @file client/js/patient/chat/chatStream.js
 * @description Client-side SSE stream reader for real-time token-by-token message rendering.
 */

import { Api } from '../../shared/api.js';

export class ChatStream {
  /**
   * Dispatches chat prompt and streams tokens via SSE reader
   */
  static async sendAndStream({ threadId, text, inputMode = 'text', language = 'en', onChunk, onDone, onError }) {
    const token = Api.getAuthToken();
    const url = `/api/chat/threads/${threadId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text,
          input_mode: inputMode,
          language
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `HTTP ${response.status} failed`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.replace('data: ', '');
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.type === 'chunk') {
                if (onChunk) onChunk(parsed.text);
              } else if (parsed.type === 'done') {
                if (onDone) onDone(parsed.message);
              } else if (parsed.type === 'error') {
                if (onError) onError(new Error(parsed.error));
              }
            } catch (e) {
              // ignore partial json
            }
          }
        }
      }
    } catch (err) {
      if (onError) onError(err);
    }
  }
}

export default ChatStream;
