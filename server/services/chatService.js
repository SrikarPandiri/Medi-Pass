/**
 * @file server/services/chatService.js
 * @description AI chat orchestration engine: thread management, prompt building,
 * privacy redaction, safety guardrail application, and Server-Sent Events (SSE) streaming.
 */

import crypto from 'crypto';
import repository from '../db/repository.js';
import config from '../config.js';
import { PromptBuilder } from './promptBuilder.js';
import { Redactor } from './redactor.js';
import { SafetyGuard } from './safetyGuard.js';
import { mockProvider } from '../ai/mockProvider.js';
import { openaiProvider } from '../ai/openaiProvider.js';
import { geminiProvider } from '../ai/geminiProvider.js';
import { anthropicProvider } from '../ai/anthropicProvider.js';

class ChatService {
  constructor() {
    this.providers = {
      mock: mockProvider,
      openai: openaiProvider,
      gemini: geminiProvider,
      anthropic: anthropicProvider
    };
  }

  getProvider() {
    return this.providers[config.ai.provider] || mockProvider;
  }

  /**
   * Retrieves or creates a active chat thread for a patient
   */
  async getOrCreateThread(patientId, title = 'New Health Conversation', language = 'en', guestId = null) {
    const threads = repository.getChatThreads(patientId, guestId);
    if (threads.length > 0) {
      return threads[0];
    }

    const thread = {
      thread_id: `th-${crypto.randomUUID()}`,
      patient_id: patientId,
      title,
      language,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived: false
    };

    return repository.createChatThread(thread, guestId);
  }

  /**
   * Processes a user chat prompt and streams the assistant reply via SSE
   */
  async processAndStream({ threadId, patientId, text, inputMode = 'text', language = 'en', guestId = null, onChunk, onDone, onError }) {
    try {
      const user = repository.findUserById(patientId, guestId);
      if (!user) {
        throw new Error('Patient not found.');
      }

      // 1. Persist user message
      const userMessage = {
        message_id: `msg-${crypto.randomUUID()}`,
        thread_id: threadId,
        role: 'user',
        content: text,
        input_mode: inputMode,
        language,
        sources: [],
        flags: [],
        feedback: null,
        created_at: new Date().toISOString()
      };
      await repository.addChatMessage(userMessage, guestId);

      // 2. Fetch raw patient records
      const rawRecords = repository.getRecordsByPatientId(patientId, guestId);

      // 3. Clinical Safety Guard Evaluation
      const safety = SafetyGuard.evaluate(text, rawRecords);

      // If Emergency or Refusal triggered
      if (!safety.safe) {
        if (safety.type === 'EMERGENCY') {
          await repository.addAuditLog({
            patient_id: patientId,
            action: 'AI_EMERGENCY_FLAGGED',
            clinic_name: 'MediPass Assistant',
            metadata: { query_preview: text.slice(0, 40), is_self_harm: safety.isSelfHarm }
          }, guestId);
        }

        const interventionReply = safety.intervention;
        const words = interventionReply.split(' ');
        for (const w of words) {
          onChunk(w + ' ');
          await new Promise(r => setTimeout(r, 20));
        }

        const assistantMsg = {
          message_id: `msg-${crypto.randomUUID()}`,
          thread_id: threadId,
          role: 'assistant',
          content: interventionReply,
          input_mode: 'text',
          language,
          sources: [],
          flags: safety.flags,
          feedback: null,
          created_at: new Date().toISOString()
        };
        await repository.addChatMessage(assistantMsg, guestId);
        onDone(assistantMsg);
        return;
      }

      // 4. Redact PII from records before passing to prompt builder
      const redactedRecords = Redactor.redactContext(rawRecords, user);

      // 5. Build structured prompt
      const { systemPrompt, contextText, citedRecordIds } = PromptBuilder.buildPrompt({
        records: redactedRecords,
        userLanguage: language,
        aiConsent: user.ai_consent,
        question: text
      });

      // 6. Record Audit Log for records access
      if (user.ai_consent && citedRecordIds && citedRecordIds.length > 0) {
        await repository.addAuditLog({
          patient_id: patientId,
          action: 'AI_ACCESSED_RECORDS',
          clinic_name: 'MediPass Assistant',
          metadata: { record_ids: citedRecordIds, count: citedRecordIds.length }
        }, guestId);
      }

      // 7. Stream from selected provider
      const provider = this.getProvider();
      const priorMessages = repository.getChatMessages(threadId, guestId);
      const chatHistory = priorMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));

      let fullContent = '';

      // If there is an allergy warning from safety guard, prepend it
      if (safety.allergyWarning) {
        const warning = safety.allergyWarning + '\n\n';
        fullContent += warning;
        onChunk(warning);
      }

      const streamGen = provider.stream({
        system: systemPrompt + '\n\n' + contextText,
        messages: chatHistory,
        language,
        question: text,
        citedRecordIds
      });

      for await (const chunk of streamGen) {
        fullContent += chunk;
        onChunk(chunk);
      }

      // 8. Persist completed assistant message
      const assistantMessage = {
        message_id: `msg-${crypto.randomUUID()}`,
        thread_id: threadId,
        role: 'assistant',
        content: fullContent,
        input_mode: 'text',
        language,
        sources: citedRecordIds || [],
        flags: safety.flags || [],
        feedback: null,
        created_at: new Date().toISOString()
      };
      await repository.addChatMessage(assistantMessage, guestId);

      onDone(assistantMessage);
    } catch (err) {
      console.error('[ChatService] Error:', err);
      onError(err);
    }
  }
}

export const chatService = new ChatService();
export default chatService;
