/**
 * @file client/js/patient/chat/quickPrompts.js
 * @description Generates personalized, multilingual suggestion chips tailored to patient records.
 */

export class QuickPrompts {
  static getPrompts(patientName = 'there', lang = 'en') {
    const prompts = {
      en: [
        { text: 'Explain my latest HbA1c report', icon: '📊' },
        { text: 'What is my Metformin for and how to take it?', icon: '💊' },
        { text: 'When should I take my medicines?', icon: '⏰' },
        { text: 'Do I have any allergies I should tell the doctor?', icon: '🚨' },
        { text: 'Summarize my last clinic visit', icon: '📋' },
        { text: 'What questions should I ask my doctor?', icon: '💡' }
      ],
      te: [
        { text: 'నా తాజా HbA1c ల్యాబ్ రిపోర్టును వివరించండి', icon: '📊' },
        { text: 'నా మెట్‌ఫార్మిన్ (Metformin) మందు దేనికి వాడతారు?', icon: '💊' },
        { text: 'నా మందులను ఏ సమయంలో తీసుకోవాలి?', icon: '⏰' },
        { text: 'డాక్టర్‌కు చెప్పాల్సిన అలర్జీలు ఏమైనా ఉన్నాయా?', icon: '🚨' },
        { text: 'నా చివరి డాక్టర్ సంప్రదింపుల సారాంశం చెప్పండి', icon: '📋' },
        { text: 'వచ్చే సారి డాక్టర్‌ను ఏ ప్రశ్నలు అడగాలి?', icon: '💡' }
      ],
      hi: [
        { text: 'मेरी नवीनतम HbA1c रिपोर्ट समझाइए', icon: '📊' },
        { text: 'मेरी मेटफॉर्मिन (Metformin) दवा किसलिए है?', icon: '💊' },
        { text: 'मुझे अपनी दवाइयां कब लेनी चाहिए?', icon: '⏰' },
        { text: 'क्या मुझे कोई एलर्जी है जो डॉक्टर को बतानी चाहिए?', icon: '🚨' },
        { text: 'मेरी पिछली डॉक्टर विजिट का सारांश दें', icon: '📋' },
        { text: 'अगली बार डॉक्टर से क्या सवाल पूछूं?', icon: '💡' }
      ],
      ta: [
        { text: 'எனது சமீபத்திய HbA1c அறிக்கையை விளக்குங்கள்', icon: '📊' },
        { text: 'எனது மெட்ஃபோர்மின் மருந்து எதற்காக?', icon: '💊' },
        { text: 'எனது மருந்துகளை எப்போது எடுத்துக்கொள்ள வேண்டும்?', icon: '⏰' },
        { text: 'மருத்துவரிடம் தெரிவிக்க வேண்டிய ஒவ்வாமைகள் உள்ளதா?', icon: '🚨' },
        { text: 'எனது முந்தைய மருத்துவ சந்திப்பை சுருக்கமாகக் கூறுங்கள்', icon: '📋' },
        { text: 'அடுத்த சந்திப்பில் மருத்துவரிடம் என்ன கேள்விகள் கேட்கலாம்?', icon: '💡' }
      ],
      kn: [
        { text: 'ನನ್ನ ಇತ್ತೀಚಿನ HbA1c ವರದಿಯನ್ನು ವಿವರಿಸಿ', icon: '📊' },
        { text: 'ನನ್ನ ಮೆಟ್‌ಫಾರ್ಮಿನ್ ಔಷಧಿಯು ಯಾವುದಕ್ಕಾಗಿ?', icon: '💊' },
        { text: 'ನನ್ನ ಔಷಧಿಗಳನ್ನು ಯಾವಾಗ ತೆಗೆದುಕೊಳ್ಳಬೇಕು?', icon: '⏰' },
        { text: 'ವೈದ್ಯರಿಗೆ ತಿಳಿಸಬೇಕಾದ ಅಲರ್ಜಿಗಳು ಇವೆಯೇ?', icon: '🚨' },
        { text: 'ನನ್ನ ಕೊನೆಯ ಭೇಟಿಯ ಸಾರಾಂಶ ನೀಡಿ', icon: '📋' },
        { text: 'ಮುಂದಿನ ಭೇಟಿಯಲ್ಲಿ ವೈದ್ಯರಿಗೆ ಯಾವ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಬೇಕು?', icon: '💡' }
      ]
    };

    return prompts[lang] || prompts.en;
  }
}

export default QuickPrompts;
