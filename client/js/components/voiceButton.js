/**
 * @file client/js/components/voiceButton.js
 * @description Voice recognition controller leveraging the Web Speech API
 * with language-specific locale adaptation (en-IN, hi-IN, te-IN, ta-IN, kn-IN).
 */

export class VoiceController {
  constructor({ onResult, onStart, onEnd, onError }) {
    this.onResult = onResult;
    this.onStart = onStart;
    this.onEnd = onEnd;
    this.onError = onError;
    this.recognition = null;
    this.isRecording = false;

    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[Speech] Web Speech API not supported on this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      this.isRecording = true;
      if (this.onStart) this.onStart();
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (this.onResult) {
        this.onResult(final || interim, Boolean(final));
      }
    };

    this.recognition.onerror = (event) => {
      this.isRecording = false;
      if (this.onError) this.onError(event.error);
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      if (this.onEnd) this.onEnd();
    };
  }

  start(lang = 'en') {
    if (!this.recognition) {
      if (this.onError) this.onError('Speech recognition not supported in this browser. Please use text input.');
      return;
    }

    const langMap = {
      te: 'te-IN',
      hi: 'hi-IN',
      ta: 'ta-IN',
      kn: 'kn-IN',
      en: 'en-IN'
    };

    this.recognition.lang = langMap[lang] || 'en-IN';
    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
    }
  }

  stop() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
  }
}

export default VoiceController;
