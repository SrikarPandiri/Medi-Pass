/**
 * @file server/ai/geminiProvider.js
 * @description Google Gemini adapter with graceful fallback to MockProvider.
 */

import { AIProvider } from './provider.js';
import { mockProvider } from './mockProvider.js';
import config from '../config.js';

export class GeminiProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = config.ai.geminiApiKey;
  }

  async *stream(request) {
    if (!this.apiKey) {
      console.log('[AI] Gemini key not set, using MockProvider.');
      yield* mockProvider.stream(request);
      return;
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${this.apiKey}`;
      const contents = (request.messages || []).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.system || '' }] },
          contents
        })
      });

      if (!response.ok) {
        console.warn(`[AI] Gemini error HTTP ${response.status}, falling back to mock.`);
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
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) yield text;
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error('[AI] Gemini stream failed:', err.message);
      yield* mockProvider.stream(request);
    }
  }

  async translate(text, targetLang) {
    return mockProvider.translate(text, targetLang);
  }
}

export const geminiProvider = new GeminiProvider();
export default geminiProvider;
