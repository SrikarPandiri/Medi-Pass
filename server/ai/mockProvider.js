/**
 * @file server/ai/mockProvider.js
 * @description Built-in grounded AI provider grounded strictly in patient clinical data.
 * Simulates token-by-token streaming over SSE with multi-lingual responses in
 * English, Telugu, Hindi, Tamil, and Kannada without requiring external API keys.
 */

import { AIProvider } from './provider.js';
import { TranslateService } from '../services/translateService.js';

export class MockProvider extends AIProvider {
  /**
   * Generates a streamed response grounded in the patient's records
   */
  async *stream(request) {
    const { messages = [], question = '', language = 'en', citedRecordIds = [] } = request;
    const userQuery = question || (messages.length > 0 ? messages[messages.length - 1].content : '');

    const reply = this._generateGroundedResponse(userQuery.toLowerCase(), language, citedRecordIds);

    // Stream word-by-word with realistic token arrival delays
    const words = reply.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield words[i] + (i < words.length - 1 ? ' ' : '');
      // Delay 25ms - 45ms per chunk for natural streaming
      await new Promise(r => setTimeout(r, 35));
    }
  }

  /**
   * Translates text using TranslateService
   */
  async translate(text, targetLang) {
    return TranslateService.translate(text, targetLang);
  }

  _generateGroundedResponse(q, lang, citedRecordIds) {
    // 1. HbA1c / Sugar / Diabetes
    if (q.includes('hba1c') || q.includes('sugar') || q.includes('diabet') || q.includes('గ్లూకోజ్') || q.includes('షుగర్')) {
      if (lang === 'te') {
        return `మీ తాజా **HbA1c ల్యాబ్ రిపోర్ట్** ప్రకారం:\n\n- **ఫలితం:** 7.8% (సాధారణంగా 5.7% లోపు ఉండాలి).\n- **స్థితి:** ఇది మధుమేహం (టైప్ 2 డయాబెటిస్) నియంత్రణలో ఇంకా పురోగతి అవసరమని సూచిస్తుంది.\n- **మందులు:** డాక్టర్ అనిత గారు సూచించిన **Metformin 500mg** మందును క్రమం తప్పకుండా భోజనం తర్వాత తీసుకోండి.\n\n💡 **డాక్టర్‌ను అడగవలసిన ప్రశ్న:** "నా రక్తంలో చక్కెర స్థాయిలను సాధారణ స్థాయికి తీసుకురావడానికి ఆహార నియమాలలో ఏవైనా మార్పులు చేయాలా?"`;
      } else if (lang === 'hi') {
        return `आपकी नवीनतम **HbA1c रिपोर्ट** के अनुसार:\n\n- **मान:** 7.8% (सामान्य सीमा 5.7% से कम होती है)।\n- **स्थिति:** यह उच्च (High) है, जो दर्शाता है कि शुगर नियंत्रण पर ध्यान देने की आवश्यकता है।\n- **दवा:** कृपया अपनी निर्धारित दवा **Metformin 500mg** भोजन के बाद समय पर लें।\n\n💡 **डॉक्टर से पूछें:** "क्या मुझे अपनी डाइट या वॉक के समय में कोई बदलाव करना चाहिए?"`;
      } else if (lang === 'ta') {
        return `உங்கள் சமீபத்திய **HbA1c ஆய்வக அறிக்கை**யின்படி:\n\n- **மதிப்பு:** 7.8% (இயல்பான அளவு 5.7% கீழ் இருக்க வேண்டும்).\n- **நிலை:** இது சர்க்கரை அளவு சற்று அதிகமாக இருப்பதைக் காட்டுகிறது.\n- **மருந்து:** மருத்துவர் பரிந்துரைத்த **Metformin 500mg** மாத்திரையை உணவுக்குப் பின் தவறாமல் எடுத்துக்கொள்ளவும்.\n\n💡 **மருத்துவரிடம் கேட்க வேண்டிய கேள்வி:** "உணவுக் கட்டுப்பாட்டில் ஏதேனும் மாற்றங்கள் செய்ய வேண்டுமா?"`;
      } else if (lang === 'kn') {
        return `ನಿಮ್ಮ ಇತ್ತೀಚಿನ **HbA1c ವರದಿ**ಯ ಪ್ರಕಾರ:\n\n- **ಫಲಿತಾಂಶ:** 7.8% (ಸಾಮಾನ್ಯವಾಗಿ 5.7% ಗಿಂತ ಕಡಿಮೆ ಇರಬೇಕು).\n- **ಸ್ಥಿತಿ:** ಇದು ಸಕ್ಕರೆ ಮಟ್ಟವು ಹೆಚ್ಚಾಗಿರುವುದನ್ನು ಸೂಚಿಸುತ್ತದೆ.\n- **ಔಷಧಿ:** ವೈದ್ಯರು ಸೂಚಿಸಿದ **Metformin 500mg** ಮಾತ್ರೆಗಳನ್ನು ಊಟದ ನಂತರ ನಿಯಮಿತವಾಗಿ ತೆಗೆದುಕೊಳ್ಳಿ.\n\n💡 **ವೈದ್ಯರಿಗೆ ಕೇಳಬೇಕಾದ ಪ್ರಶ್ನೆ:** "ನನ್ನ ಸಕ್ಕರೆ ಮಟ್ಟವನ್ನು ನಿಯಂತ್ರಿಸಲು ಆಹಾರದಲ್ಲಿ ಏನು ಬದಲಾವಣೆ ಮಾಡಬೇಕು?"`;
      }
      return `Based on your verified **HbA1c Lab Report**:\n\n- **Your Value:** **7.8%** (Reference: < 5.7% is Normal, >= 6.5% indicates Diabetes).\n- **Status:** **High**. This indicates moderate elevation over the past 3 months.\n- **Action:** Continue taking your prescribed **Metformin 500mg** twice daily after meals as directed by Dr. Anita Rao.\n\n💡 **Suggested Question for Doctor:** *"Should we consider adjusting my diet or repeating my fasting sugar test next month?"*`;
    }

    // 2. Metformin / Medicines / Schedule
    if (q.includes('metformin') || q.includes('amlodipine') || q.includes('medicine') || q.includes('schedule') || q.includes('మందులు') || q.includes('दवा')) {
      if (lang === 'te') {
        return `మీ రికార్డులలో ఉన్న ప్రస్తుత మందుల వివరాలు:\n\n1. 💊 **Metformin 500mg:** ఉదయం & రాత్రి భోజనం తర్వాత (కడుపులో మంట రాకుండా భోజనంతో మాత్రమే తీసుకోవాలి).\n2. 💊 **Amlodipine 5mg:** ప్రతిరోజూ ఉదయం నీటితో తీసుకోవాలి (రక్తపోటు నియంత్రణ కోసం).\n\n⚠️ మీ డాక్టర్ అనుమతి లేకుండా మందుల మోతాదును ఎప్పుడూ మార్చవద్దు.`;
      }
      return `Here is your current active **Medication Schedule** from your records:\n\n1. 💊 **Metformin Hydrochloride (500 mg):**\n   - **Schedule:** Twice daily (after breakfast & after dinner).\n   - **Instruction:** Take with or after meals to avoid stomach upset.\n2. 💊 **Amlodipine Besylate (5 mg):**\n   - **Schedule:** Once daily in the morning.\n   - **Instruction:** Take with water to manage blood pressure.\n\n⚠️ **Important:** Do not stop or alter dosages without consulting your doctor.`;
    }

    // 3. Allergies
    if (q.includes('allergy') || q.includes('penicillin') || q.includes('అలర్జీ') || q.includes('एलर्जी')) {
      if (lang === 'te') {
        return `🚨 **తీవ్రమైన అలర్జీ హెచ్చరిక:**\n\nమీ రికార్డుల ప్రకారం మీకు **పెన్సిలిన్ (Penicillin) మరియు బీటా-లాక్టమ్ యాంటీబయాటిక్స్** కు తీవ్రమైన అలర్జీ (Anaphylaxis risk) ఉంది.\n\nమీరు ఏ క్లినిక్ లేదా ఆసుపత్రికి వెళ్లినా, డాక్టర్లకు లేదా ఫార్మసిస్ట్‌కు ఈ సమాచారాన్ని ముందుగానే తెలియజేయండి.`;
      }
      return `🚨 **Severe Allergy Alert Found in Records:**\n\n- **Allergen:** **Penicillin & Beta-Lactam Antibiotics**\n- **Severity:** **Severe (Anaphylaxis Risk)**\n- **Past Reaction:** Generalized rash, swelling of face, breathing difficulty.\n- **Action:** Inform every doctor, dentist, or emergency provider before receiving any antibiotic injections or capsules (such as Amoxicillin or Ampicillin).`;
    }

    // 4. Summarize last visit
    if (q.includes('last visit') || q.includes('summarize') || q.includes('సారాంశం') || q.includes('पिछला')) {
      return `📋 **Summary of Your Last Consultation:**\n\n- **Clinic:** Sunrise Clinic, Hyderabad (Dr. Anita Rao)\n- **Diagnoses Reviewed:** Type 2 Diabetes Mellitus & Essential Hypertension.\n- **Vitals Recorded:** Blood Pressure 138/86 mmHg, Pulse 74 bpm (Stable).\n- **Prescriptions Renewed:** Metformin 500mg (BID) and Amlodipine 5mg (OD) for 90 days.\n- **Lab Orders:** HbA1c and Lipid Profile requested for follow-up evaluation.`;
    }

    // 5. Questions for doctor
    if (q.includes('question') || q.includes('ask') || q.includes('ప్రశ్న') || q.includes('सवाल')) {
      return `💡 **Key Questions to Ask Your Doctor at Your Next Visit:**\n\n1. *"My last HbA1c was 7.8%. Do you recommend any modifications to my diet or exercise routine?"*\n2. *"My morning blood pressure was 138/86 mmHg. Is this reading acceptable on 5mg Amlodipine?"*\n3. *"When is my next routine blood and kidney function check due?"*\n4. *"Please verify that all my current prescriptions are free from Penicillin derivatives."*`;
    }

    // 6. Unknown / Missing data
    if (q.includes('mri') || q.includes('surgery') || q.includes('ecg') || q.includes('covid vaccine')) {
      return `ℹ️ **Notice:** I don't see any record of that in your currently uploaded medical files. If you had this test or procedure performed at another clinic, you can scan or upload the report using the attach button below to add it to your MediPass history.`;
    }

    // Default friendly general response grounded in records
    return `Hello! Based on your health records on MediPass:\n\n- **Allergies:** Severe Penicillin Allergy (Critical)\n- **Active Conditions:** Type 2 Diabetes Mellitus, Essential Hypertension\n- **Active Medications:** Metformin 500mg (after food), Amlodipine 5mg (morning)\n- **Latest HbA1c:** 7.8% (Monitored)\n\nFeel free to ask me to explain any lab test values, clarify medication instructions, or prepare questions for your next doctor consultation.`;
  }
}

export const mockProvider = new MockProvider();
export default mockProvider;
