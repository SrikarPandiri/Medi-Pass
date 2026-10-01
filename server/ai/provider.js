/**
 * @file server/ai/provider.js
 * @description Base interface definition for AI model providers.
 */

/**
 * @typedef {Object} ChatRequest
 * @property {string} system - System prompt and guidelines
 * @property {Array<{role: string, content: string}>} messages - Prior chat history
 * @property {object} [context] - Redacted patient clinical records context
 * @property {string} language - Target ISO language ('en'|'hi'|'te'|'ta'|'kn')
 * @property {string} [question] - Current prompt
 * @property {string[]} [citedRecordIds] - IDs of in-scope records
 */

export class AIProvider {
  /**
   * Async generator that streams token chunks
   * @param {ChatRequest} request
   * @returns {AsyncGenerator<string, void, unknown>}
   */
  async *stream(request) {
    throw new Error('AIProvider.stream() must be implemented by subclass.');
  }

  /**
   * Translates text to target language
   * @param {string} text
   * @param {string} targetLang
   * @returns {Promise<string>}
   */
  async translate(text, targetLang) {
    throw new Error('AIProvider.translate() must be implemented by subclass.');
  }
}

export default AIProvider;
