/**
 * @file server/services/redactor.js
 * @description Patient privacy redaction engine: strips personal identifiers
 * (names, phone numbers, ABHA IDs, email addresses) before sending context to AI providers.
 */

export class Redactor {
  /**
   * Redacts personal identifiers from text and record contents
   */
  static redactContext(records, user) {
    const knownPii = [];

    if (user) {
      if (user.name) knownPii.push(user.name);
      if (user.phone_number) knownPii.push(user.phone_number);
      if (user.abha_id) knownPii.push(user.abha_id);
      if (user.email) knownPii.push(user.email);
      if (user.emergency_contact_phone) knownPii.push(user.emergency_contact_phone);
    }

    const cleanRecords = records.map(rec => {
      let contentString = typeof rec.content === 'string' ? rec.content : JSON.stringify(rec.content);

      // Redact known user PII
      for (const pii of knownPii) {
        if (pii && pii.length > 2) {
          const esc = pii.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(esc, 'gi');
          contentString = contentString.replace(regex, '[REDACTED_IDENTIFIER]');
        }
      }

      // Regex patterns for generic phone, ABHA-like numbers, emails
      contentString = contentString
        .replace(/\b[6-9]\d{9}\b/g, '[REDACTED_PHONE]')
        .replace(/\b\d{2}-\d{4}-\d{4}-\d{4}\b/g, '[REDACTED_ABHA]')
        .replace(/([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,5})/g, '[REDACTED_EMAIL]');

      let parsedContent;
      try {
        parsedContent = JSON.parse(contentString);
      } catch (e) {
        parsedContent = contentString;
      }

      return {
        record_id: rec.record_id,
        record_type: rec.record_type,
        title: rec.title,
        content: parsedContent,
        created_at: rec.created_at,
        clinic_name: rec.clinic_name
      };
    });

    return cleanRecords;
  }
}

export default Redactor;
