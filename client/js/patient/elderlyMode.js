/**
 * @file client/js/patient/elderlyMode.js
 * @description Accessible Elderly Mode controller toggling enlarged fonts and high-contrast tokens.
 */

export class ElderlyMode {
  static init() {
    const isEnabled = localStorage.getItem('medipass_elderly_mode') === 'true';
    if (isEnabled) {
      document.body.classList.add('elderly-mode');
    }
  }

  static toggle() {
    document.body.classList.toggle('elderly-mode');
    const enabled = document.body.classList.contains('elderly-mode');
    localStorage.setItem('medipass_elderly_mode', enabled ? 'true' : 'false');
    return enabled;
  }
}

ElderlyMode.init();
export default ElderlyMode;
