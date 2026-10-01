/**
 * @file server/services/ocrService.js
 * @description OCR Prescription Digitizer service with simulated intelligent vision parsing
 * and a pluggable interface for Tesseract.js or multimodal vision LLMs.
 */

export class OcrService {
  /**
   * Extracts clinical prescription entities from an image buffer or base64 data
   * @param {Buffer|string} imageInput
   * @param {string} [mimeType='image/jpeg']
   * @returns {Promise<object>} Extracted clinical fields
   */
  static async extractPrescription(imageInput, mimeType = 'image/jpeg') {
    // Simulate neural vision model processing delay (600ms - 1000ms)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Realistic clinical digitized extraction sample
    return {
      success: true,
      confidence: 0.94,
      model: 'MediPass-Vision-OCR-v2 (Mock)',
      extracted_data: {
        patient_name: 'Lakshmi Devi',
        diagnosis: 'Type 2 Diabetes Mellitus & Stage 1 Hypertension',
        doctor_notes: 'Patient reports mild morning dizziness. Advised to take Amlodipine with breakfast and monitor fasting blood sugar regularly.',
        medications: [
          {
            name: 'Metformin Hydrochloride',
            dose: '500 mg',
            frequency: '1-0-1 (Twice daily after food)',
            duration: '90 days',
            instructions: 'Take strictly after meals to prevent gastric irritation.'
          },
          {
            name: 'Amlodipine Besylate',
            dose: '5 mg',
            frequency: '1-0-0 (Once daily morning)',
            duration: '90 days',
            instructions: 'Take in the morning with water.'
          },
          {
            name: 'Multivitamin & Zinc (Becozinc)',
            dose: '1 capsule',
            frequency: '0-1-0 (Once daily after lunch)',
            duration: '30 days',
            instructions: 'Nutritional supplement.'
          }
        ]
      }
    };
  }
}

export default OcrService;
