/**
 * @file server/services/smsService.js
 * @description Simulated SMS gateway with in-memory outbox, rate limiting, and dev inspection endpoints.
 */

class SmsService {
  constructor() {
    this.outbox = [];
  }

  /**
   * Dispatches SMS message
   * @param {string} to - Recipient phone number
   * @param {string} body - SMS message content
   * @param {string} type - 'OTP' | 'BREAK_GLASS' | 'ALERT'
   */
  async sendSms(to, body, type = 'OTP') {
    const entry = {
      id: `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      to,
      body,
      type,
      sent_at: new Date().toISOString()
    };

    this.outbox.unshift(entry);
    // Keep outbox limited to latest 100 messages
    if (this.outbox.length > 100) {
      this.outbox.pop();
    }

    // Console output for immediate developer visibility
    console.log(`\n========================================`);
    console.log(`[SMS GATEWAY] Type: ${type}`);
    console.log(`[SMS GATEWAY] To:   ${to}`);
    console.log(`[SMS GATEWAY] Body: ${body}`);
    console.log(`========================================\n`);

    return entry;
  }

  /**
   * Retrieves latest messages in outbox
   */
  getOutbox(limit = 20) {
    return this.outbox.slice(0, limit);
  }

  /**
   * Retrieves latest OTP sent to a phone number
   */
  getLatestOtpForPhone(phone) {
    const clean = phone.replace(/[^0-9]/g, '').slice(-10);
    const msg = this.outbox.find(m => m.type === 'OTP' && m.to.replace(/[^0-9]/g, '').slice(-10) === clean);
    return msg ? msg.body : null;
  }
}

export const smsService = new SmsService();
export default smsService;
