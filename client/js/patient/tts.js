/**
 * @file client/js/patient/tts.js
 * @description Patient Text-To-Speech engine using Web Speech API SpeechSynthesis
 * with voice selection across Indian languages and rate control.
 */

export class TTSPlayer {
  static currentUtterance = null;

  /**
   * Speaks text using SpeechSynthesis
   */
  static speak(text, lang = 'en', rate = 1.0) {
    if (!('speechSynthesis' in window)) {
      console.warn('[TTS] SpeechSynthesis not supported.');
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;

    const langVoiceMap = {
      te: 'te-IN',
      hi: 'hi-IN',
      ta: 'ta-IN',
      kn: 'kn-IN',
      en: 'en-IN'
    };

    utterance.lang = langVoiceMap[lang] || 'en-IN';

    // Find best matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.includes(lang));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Reads patient records aloud with high emphasis on severe allergies first, followed by active medications
   */
  static readRecordsAloud(records = [], lang = 'en') {
    const allergies = records.filter(r => r.record_type === 'Allergy');
    const prescriptions = records.filter(r => r.record_type === 'Prescription');

    let speechText = '';

    if (allergies.length > 0) {
      speechText += 'Attention! Medical Alert. Critical Allergies recorded: ';
      for (const a of allergies) {
        const c = a.content;
        speechText += `${a.title}. ${typeof c === 'object' ? c.severity || '' : c}. `;
      }
    }

    if (prescriptions.length > 0) {
      speechText += ' Active Prescriptions: ';
      for (const p of prescriptions) {
        const c = p.content;
        speechText += `${p.title}. Take ${typeof c === 'object' ? c.frequency || '' : c}. `;
      }
    }

    if (!speechText) {
      speechText = 'No critical allergies or active prescriptions found.';
    }

    this.speak(speechText, lang, 0.95);
  }

  static stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export default TTSPlayer;
