/**
 * @file server/routes/tts.js
 * @description Pluggable server-side Text-To-Speech fallback route.
 */

import { Router } from 'express';

const router = Router();

/**
 * Server TTS synthesis fallback
 */
router.post('/', async (req, res, next) => {
  try {
    const { text, language = 'en' } = req.body;
    if (!text) {
      return res.status(400).json({ error: { code: 'MISSING_TEXT', message: 'Text is required for TTS synthesis.' } });
    }

    // In prototype, return a status indicating client should prefer Web Speech API SpeechSynthesis
    res.json({
      status: 'fallback_available',
      client_recommendation: 'Use browser SpeechSynthesis for low-latency playback.',
      language,
      text_length: text.length
    });
  } catch (err) {
    next(err);
  }
});

export default router;
