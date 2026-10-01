/**
 * @file server/ai/anthropicProvider.js
 * @description Anthropic Claude adapter with graceful fallback to MockProvider.
 */

import { AIProvider } from './provider.js';
import { mockProvider } from './mockProvider.js';
import config from '../config.js';

export class AnthropicProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = config.ai.anthropicApiKey;
  }

  async *stream(request) {
    if (!this.apiKey) {
      console.log('[AI] Anthropic key not set, using MockProvider.');
      yield* mockProvider.stream(request);
      return;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          system: request.system || '',
          messages: (request.messages || []).map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          })),
          stream: true
        })
      });

      if (!response.ok) {
        console.warn(`[AI] Anthropic error HTTP ${response.status}, falling back to mock.`);
        yield* mockProvider.stream(request);
        return;
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
            const dataStr = trimmed.replace('data: ', '');
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'content_block_delta') {
                const delta = parsed.delta?.text;
                if (delta) yield delta;
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error('[AI] Anthropic stream failed:', err.message);
      yield* mockProvider.stream(request);
    }
  }

  async translate(text, targetLang) {
    return mockProvider.translate(text, targetLang);
  }
}

export const anthropicProvider = new AnthropicProvider();
export default anthropicProvider;
