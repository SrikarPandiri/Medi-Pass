/**
 * @file server/routes/chat.js
 * @description MediPass Assistant AI chat routes: conversation drawer threads,
 * Server-Sent Events (SSE) streaming answers, translation, feedback, and speech transcription.
 */

import { Router } from 'express';
import crypto from 'crypto';
import { authPatient } from '../middleware/authPatient.js';
import repository from '../db/repository.js';
import { chatService } from '../services/chatService.js';
import { TranslateService } from '../services/translateService.js';
import { chatLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Protect all chat routes with patient or guest patient auth
router.use(authPatient);

/**
 * List active chat threads
 */
router.get('/threads', (req, res, next) => {
  try {
    const threads = repository.getChatThreads(req.user.user_id, req.guestId);
    res.json({ threads });
  } catch (err) {
    next(err);
  }
});

/**
 * Create a new chat thread
 */
router.post('/threads', async (req, res, next) => {
  try {
    const { title, language = 'en' } = req.body;
    const thread = {
      thread_id: `th-${crypto.randomUUID()}`,
      patient_id: req.user.user_id,
      title: title || 'New Health Consultation',
      language,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived: false
    };

    const saved = await repository.createChatThread(thread, req.guestId);
    res.status(201).json({ thread: saved });
  } catch (err) {
    next(err);
  }
});

/**
 * Update thread (rename/archive)
 */
router.patch('/threads/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, archived, language } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (archived !== undefined) updates.archived = archived;
    if (language !== undefined) updates.language = language;

    const updated = await repository.updateChatThread(id, updates, req.guestId);
    res.json({ thread: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * Delete chat thread
 */
router.delete('/threads/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await repository.deleteChatThread(id, req.guestId);
    res.json({ success: true, message: 'Thread deleted.' });
  } catch (err) {
    next(err);
  }
});

/**
 * Get messages in a thread
 */
router.get('/threads/:id/messages', (req, res, next) => {
  try {
    const { id } = req.params;
    const messages = repository.getChatMessages(id, req.guestId);
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

/**
 * Send message and stream reply via Server-Sent Events (SSE)
 */
router.post('/threads/:id/messages', chatLimiter, async (req, res, next) => {
  const { id } = req.params;
  const { text, input_mode = 'text', language = 'en' } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: { code: 'MISSING_TEXT', message: 'Message text is required.' } });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const onChunk = (chunk) => {
    res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
  };

  const onDone = (finalMessage) => {
    res.write(`data: ${JSON.stringify({ type: 'done', message: finalMessage })}\n\n`);
    res.end();
  };

  const onError = (err) => {
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.end();
  };

  await chatService.processAndStream({
    threadId: id,
    patientId: req.user.user_id,
    text: text.trim(),
    inputMode: input_mode,
    language,
    guestId: req.guestId,
    onChunk,
    onDone,
    onError
  });
});

/**
 * Record message helpfulness feedback (up/down)
 */
router.post('/messages/:id/feedback', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body; // 'up' | 'down' | null
    const updated = await repository.updateMessageFeedback(id, feedback, req.guestId);
    res.json({ success: true, message: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * Multi-lingual Translation for assistant messages
 */
router.post('/translate', async (req, res, next) => {
  try {
    const { text, target_lang } = req.body;
    if (!text || !target_lang) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'text and target_lang are required.' } });
    }

    const translated = await TranslateService.translate(text, target_lang);
    res.json({ original: text, translated, target_lang });
  } catch (err) {
    next(err);
  }
});

/**
 * Speech-to-Text Transcription Fallback Endpoint
 */
router.post('/transcribe', async (req, res, next) => {
  try {
    // Simulated STT processing
    const { language = 'en' } = req.body;
    res.json({
      success: true,
      transcript: language === 'te' ? 'నా తాజా ల్యాబ్ రిపోర్టుల వివరాలు తెలపండి' : 'Can you explain my latest lab report?'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
