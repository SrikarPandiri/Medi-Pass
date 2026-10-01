/**
 * @file server/ai/openaiProvider.js
 * @description OpenAI adapter with graceful fallback to MockProvider if API key is absent.
 */

import { AIProvider } from './provider.js';
import { mockProvider } from './mockProvider.js';
import config from '../config.js';

export class OpenAIProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = config.ai.openaiApiKey;
  }

  async *stream(request) {
    if (!this.apiKey) {
      console.log('[AI] OpenAI key not set, using MockProvider.');
      yield* mockProvider.stream(request);
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: request.system || '' },
            ...(request.messages || [])
          ],
          stream: true
        })
      });

      if (!response.ok) {
        console.warn(`[AI] OpenAI error HTTP ${response.status}, falling back to mock.`);
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
            if (dataStr === '[DONE]') return;
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) yield delta;
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      console.error('[AI] OpenAI streaming failed:', err.message);
      yield* mockProvider.stream(request);
    }
  }

  async translate(text, targetLang) {
    return mockProvider.translate(text, targetLang);
  }
}

export const openaiProvider = new OpenAIProvider();
export default openaiProvider;
