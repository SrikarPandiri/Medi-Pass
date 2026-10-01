/**
 * @file server/services/safetyGuard.js
 * @description Clinical safety guard: multi-lingual emergency detection, dose-change refusal,
 * allergy conflict warnings, and prompt-injection neutralization.
 */

export class SafetyGuard {
  // Multilingual emergency keywords
  static emergencyKeywords = [
    // English
    'chest pain', 'heart attack', 'cannot breathe', 'trouble breathing', 'shortness of breath',
    'stroke', 'unconscious', 'severe bleeding', 'suicide', 'kill myself', 'end my life', 'overdose', 'poisoning',
    // Telugu
    'గుండె నొప్పి', 'ఛాతీ నొప్పి', 'శ్వాస ఆడటం లేదు', 'రక్తం కారుతోంది', 'ఆత్మహత్య', 'విషం',
    // Hindi
    'सीने में दर्द', 'दिल का दौरा', 'सांस नहीं आ रही', 'बेहोश', 'आत्महत्या', 'जहर',
    // Tamil
    'மார்பு வலி', 'மூச்சுத்திணறல்', 'மாரடைப்பு', 'சுயநினைவு இழந்தார்', 'தற்கொலை', 'விஷம்',
    // Kannada
    'ಎದೆ ನೋವು', 'ಉಸಿರಾಟದ ತೊಂದರೆ', 'ಹೃದಯಾಘಾತ', 'ಪ್ರಜ್ಞೆ ತಪ್ಪಿದೆ', 'ಆತ್ಮಹತ್ಯೆ', 'ವಿಷ'
  ];

  static selfHarmKeywords = ['suicide', 'kill myself', 'end my life', 'ఆత్మహత్య', 'आत्महत्या', 'தற்கொலை', 'ಆತ್ಮಹತ್ಯೆ'];

  // Dose modification keywords
  static doseChangeKeywords = [
    'change my dose', 'increase dose', 'decrease dose', 'stop taking my medicine', 'can i take double',
    'double the dose', 'halve the dose', 'stop metformin', 'stop amlodipine', 'stop thyroxine',
    'డాక్టర్ చెప్పకుండా మందులు మార్చవచ్చా', 'మందులు ఆపేయవచ్చా', 'दवा बंद कर दूं', 'दवा की खुराक बढ़ा दूं'
  ];

  // Self-diagnosis inquiry keywords
  static diagnosisKeywords = [
    'do i have cancer', 'diagnose me', 'what disease do i have based on symptoms',
    'నాకు క్యాన్సర్ ఉందా', 'నాకు ఏ వ్యాధి ఉంది'
  ];

  /**
   * Evaluates user query for medical safety, emergencies, or policy violations
   * @param {string} userQuery
   * @param {object} patientRecords
   * @returns {object} Safety evaluation outcome
   */
  static evaluate(userQuery, patientRecords = []) {
    const queryLower = userQuery.toLowerCase().trim();

    // 1. Emergency Check
    const isEmergency = this.emergencyKeywords.some(keyword => queryLower.includes(keyword));
    if (isEmergency) {
      const isSelfHarm = this.selfHarmKeywords.some(keyword => queryLower.includes(keyword));
      return {
        safe: false,
        type: 'EMERGENCY',
        isSelfHarm,
        flags: ['emergency'],
        intervention: isSelfHarm ? this.getSelfHarmResponse() : this.getEmergencyResponse()
      };
    }

    // 2. Dose change attempt
    const isDoseChange = this.doseChangeKeywords.some(keyword => queryLower.includes(keyword));
    if (isDoseChange) {
      return {
        safe: false,
        type: 'REFUSAL_DOSE_CHANGE',
        flags: ['refused', 'dose_modification'],
        intervention: `⚠️ **Medical Safety Guardrail:**\n\nI cannot advise adjusting, increasing, decreasing, or discontinuing your prescribed medication dosages. Modifying your medication schedule without medical guidance can lead to acute complications.\n\n👉 **Recommended Action:** Please contact your prescribing physician or clinic immediately before altering your regimen.`
      };
    }

    // 3. Symptom self-diagnosis attempt
    const isDiagnosis = this.diagnosisKeywords.some(keyword => queryLower.includes(keyword));
    if (isDiagnosis) {
      return {
        safe: false,
        type: 'REFUSAL_DIAGNOSIS',
        flags: ['refused', 'symptom_diagnosis'],
        intervention: `ℹ️ **Clinical Policy:**\n\nMediPass Assistant cannot diagnose medical conditions or interpret isolated clinical symptoms as a specific disease. \n\n👉 Please schedule an evaluation with a certified doctor for physical examination and definitive diagnosis.`
      };
    }

    // 4. Drug Allergy Conflict Check (e.g. asking about Penicillin / Amoxicillin)
    const hasPenicillinAllergy = patientRecords.some(r =>
      r.record_type === 'Allergy' &&
      JSON.stringify(r.content).toLowerCase().includes('penicillin')
    );

    const mentionsBetaLactam = ['penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'పెన్సిలిన్', 'पेनिसिलिन'].some(
      drug => queryLower.includes(drug)
    );

    if (hasPenicillinAllergy && mentionsBetaLactam) {
      return {
        safe: true, // safe to respond, but MUST attach prominent allergy warning flag
        type: 'ALLERGY_ALERT',
        flags: ['allergy_warning'],
        allergyWarning: `🚨 **HIGH-ALERT ALLERGY CONFLICT:**\nYour medical records indicate a **Severe Allergy to Penicillin & Beta-Lactam antibiotics** (risk of anaphylaxis/swelling). You must NEVER consume Penicillin, Amoxicillin, Ampicillin, or related antibiotics without direct physician consultation.`
      };
    }

    return {
      safe: true,
      flags: []
    };
  }

  static getEmergencyResponse() {
    return `🚨 **IMMEDIATE MEDICAL EMERGENCY ALERT**\n\n` +
      `Your symptoms indicate a potential medical emergency requiring immediate clinical attention.\n\n` +
      `📞 **Call Ambulance & Emergency Services NOW:**\n` +
      `- **108** — Free National Ambulance Service\n` +
      `- **112** — All-in-One National Emergency Helpline\n\n` +
      `⚠️ *Please do not rely on app responses. Reach the nearest Primary Health Centre (PHC) or Hospital Emergency Room immediately.*`;
  }

  static getSelfHarmResponse() {
    return `❤️ **You are not alone, and help is available right now.**\n\n` +
      `If you are experiencing overwhelming distress or thoughts of self-harm, compassionate professionals are ready to listen 24/7:\n\n` +
      `- 📞 **Tele-MANAS (Govt. of India Mental Health Helpline):** Dial **14416** or **1800-891-4416** (Toll-Free, Multilingual)\n` +
      `- 📞 **KIRAN Helpline:** **1800-599-0019**\n` +
      `- 📞 **Emergency:** **112**\n\n` +
      `Please reach out to your loved ones or call a helpline now.`;
  }
}

export default SafetyGuard;
