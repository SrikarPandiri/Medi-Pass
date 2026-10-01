/**
 * @file client/js/patient/chat/speechInput.js
 * @description Speech input wrapper managing speech recognition states.
 */

import { VoiceController } from '../../components/voiceButton.js';

export class SpeechInput {
  static create({ onTranscript, onStateChange, onError }) {
    return new VoiceController({
      onResult: (text, isFinal) => {
        if (onTranscript) onTranscript(text, isFinal);
      },
      onStart: () => {
        if (onStateChange) onStateChange(true);
      },
      onEnd: () => {
        if (onStateChange) onStateChange(false);
      },
      onError: (err) => {
        if (onStateChange) onStateChange(false);
        if (onError) onError(err);
      }
    });
  }
}

export default SpeechInput;
