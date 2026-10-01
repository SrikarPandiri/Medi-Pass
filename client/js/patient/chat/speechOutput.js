/**
 * @file client/js/patient/chat/speechOutput.js
 * @description Speech synthesis wrapper for assistant messages.
 */

import { TTSPlayer } from '../tts.js';

export class SpeechOutput {
  static play(text, lang = 'en', rate = 1.0) {
    TTSPlayer.speak(text, lang, rate);
  }

  static stop() {
    TTSPlayer.stop();
  }
}

export default SpeechOutput;
