/**
 * @file server/db/guestSeed.js
 * @description Isolated sandbox mock data for Guest Patients and Guest Doctors.
 * Guarantees zero write-through to permanent storage.
 */

/**
 * Generates an independent in-memory sandbox data clone for guest sessions
 * @returns {object} Isolated sandbox state
 */
export function createGuestSeed() {
  const patientId = 'guest-patient-asha';
  const doctorId = 'guest-doc-001';

  const userPatient = {
    user_id: patientId,
    name: 'Asha Sharma (Guest)',
    role: 'guest_patient',
    phone_number: '+919999900001',
    email: 'asha.guest@medipass.local',
    abha_id: '91-9999-0000-1111',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    language_pref: 'en',
    emergency_contact_phone: '+919999900099',
    ai_consent: true,
    is_guest: true,
    created_at: new Date().toISOString()
  };

  const userDoctor = {
    user_id: doctorId,
    name: 'Dr. Guest (MD)',
    role: 'guest_doctor',
    phone_number: '+919999900002',
    email: 'doctor.guest@medipass.local',
    abha_id: 'DOC-GUEST-99',
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    language_pref: 'en',
    emergency_contact_phone: null,
    ai_consent: false,
    is_guest: true,
    created_at: new Date().toISOString()
  };

  const doctorProfile = {
    user_id: doctorId,
    license_id: 'GUEST-DOC-001',
    clinic_name: 'Community Health Centre (Demo)',
    clinic_city: 'Secunderabad',
    specialization: 'Family Medicine & Primary Care',
    verification_status: 'verified'
  };

  const medicalRecords = [
    {
      record_id: 'g-rec-001',
      patient_id: patientId,
      record_type: 'BloodGroup',
      title: 'Blood Group Card',
      content: { blood_group: 'B+', rh_factor: 'Positive' },
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      clinic_name: 'Community Health Centre (Demo)',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    },
    {
      record_id: 'g-rec-002',
      patient_id: patientId,
      record_type: 'Allergy',
      title: 'Penicillin Allergy (High Alert)',
      content: {
        allergen: 'Penicillin, Ampicillin',
        severity: 'Severe / Anaphylaxis Risk',
        reaction: 'Swelling of throat, hives, hypotension'
      },
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      clinic_name: 'Community Health Centre (Demo)',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    },
    {
      record_id: 'g-rec-003',
      patient_id: patientId,
      record_type: 'Diagnosis',
      title: 'Hypothyroidism',
      content: {
        code: 'ICD-10 E03.9',
        description: 'Primary hypothyroidism on daily levothyroxine replacement therapy.'
      },
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      clinic_name: 'Community Health Centre (Demo)',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    },
    {
      record_id: 'g-rec-004',
      patient_id: patientId,
      record_type: 'Diagnosis',
      title: 'Mild Essential Hypertension',
      content: {
        code: 'ICD-10 I10',
        description: 'Controlled on low-dose calcium channel blocker.'
      },
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      clinic_name: 'Community Health Centre (Demo)',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    },
    {
      record_id: 'g-rec-005',
      patient_id: patientId,
      record_type: 'Prescription',
      title: 'Thyroxine 50 mcg Tablet',
      content: {
        medication_name: 'Thyroxine Sodium (Eltroxin)',
        dosage: '50 mcg',
        frequency: 'Once daily (strictly on an empty stomach)',
        duration: '90 days',
        instructions: 'Take 30-45 minutes before morning tea or breakfast with water.'
      },
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      clinic_name: 'Community Health Centre (Demo)',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    },
    {
      record_id: 'g-rec-006',
      patient_id: patientId,
      record_type: 'Prescription',
      title: 'Telmisartan 20 mg Tablet',
      content: {
        medication_name: 'Telmisartan',
        dosage: '20 mg',
        frequency: 'Once daily after breakfast',
        duration: '60 days',
        instructions: 'Take consistently at the same time each morning.'
      },
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      clinic_name: 'Community Health Centre (Demo)',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    },
    {
      record_id: 'g-rec-007',
      patient_id: patientId,
      record_type: 'Lab Report',
      title: 'Thyroid Stimulating Hormone (TSH)',
      content: {
        test_name: 'Serum TSH Ultra-sensitive',
        value: 2.45,
        unit: 'uIU/mL',
        reference_range: '0.40 - 4.20 uIU/mL',
        status: 'Normal',
        clinical_note: 'Optimal euthyroid range achieved on current 50 mcg dose.'
      },
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      clinic_name: 'Reliable Diagnostic Centre',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    },
    {
      record_id: 'g-rec-008',
      patient_id: patientId,
      record_type: 'Lab Report',
      title: 'HbA1c Glycemic Marker',
      content: {
        test_name: 'Glycated Hemoglobin (HbA1c)',
        value: 5.4,
        unit: '%',
        reference_range: '< 5.7% (Normal)',
        status: 'Normal'
      },
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      clinic_name: 'Reliable Diagnostic Centre',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    },
    {
      record_id: 'g-rec-009',
      patient_id: patientId,
      record_type: 'Lab Report',
      title: 'Vitamin D (25-OH)',
      content: {
        test_name: '25-Hydroxy Vitamin D',
        value: 18.2,
        unit: 'ng/mL',
        reference_range: '30 - 100 ng/mL (Sufficient), 20 - 29 (Insufficient), < 20 (Deficient)',
        status: 'Deficient',
        clinical_note: 'Supplementation with Cholecalciferol 60k IU recommended once weekly.'
      },
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      clinic_name: 'Reliable Diagnostic Centre',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    },
    {
      record_id: 'g-rec-010',
      patient_id: patientId,
      record_type: 'Lab Report',
      title: 'Serum Calcium',
      content: {
        test_name: 'Calcium (Total)',
        value: 9.3,
        unit: 'mg/dL',
        reference_range: '8.8 - 10.2 mg/dL',
        status: 'Normal'
      },
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      clinic_name: 'Reliable Diagnostic Centre',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    },
    {
      record_id: 'g-rec-011',
      patient_id: patientId,
      record_type: 'Vitals',
      title: 'Resting Blood Pressure',
      content: {
        blood_pressure: '124/80 mmHg',
        pulse: '72 bpm',
        spo2: '99%',
        status: 'Well Controlled'
      },
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      clinic_name: 'Community Health Centre (Demo)',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    },
    {
      record_id: 'g-rec-012',
      patient_id: patientId,
      record_type: 'Vitals',
      title: 'Body Mass Index & Weight',
      content: {
        weight: '58 kg',
        height: '158 cm',
        bmi: '23.2 kg/m²',
        status: 'Normal Range'
      },
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      clinic_name: 'Community Health Centre (Demo)',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    },
    {
      record_id: 'g-rec-013',
      patient_id: patientId,
      record_type: 'Prescription',
      title: 'Vitamin D3 60,000 IU Sachets',
      content: {
        medication_name: 'Cholecalciferol Sachet',
        dosage: '60,000 IU',
        frequency: 'Once weekly with warm milk for 8 weeks',
        duration: '8 weeks',
        instructions: 'Mix thoroughly in a small glass of warm milk after food.'
      },
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      clinic_name: 'Community Health Centre (Demo)',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    },
    {
      record_id: 'g-rec-014',
      patient_id: patientId,
      record_type: 'Lab Report',
      title: 'Serum Ferritin (Iron Stores)',
      content: {
        test_name: 'Serum Ferritin',
        value: 32,
        unit: 'ng/mL',
        reference_range: '13 - 150 ng/mL',
        status: 'Normal'
      },
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      clinic_name: 'Reliable Diagnostic Centre',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    },
    {
      record_id: 'g-rec-015',
      patient_id: patientId,
      record_type: 'Diagnosis',
      title: 'Vitamin D Deficiency',
      content: {
        code: 'ICD-10 E55.9',
        description: 'Hypovitaminosis D. Under active supplementation.'
      },
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      clinic_name: 'Community Health Centre (Demo)',
      doctor_id: doctorId,
      sync_status: 'SYNCED'
    }
  ];

  const auditLogs = [
    {
      log_id: 'g-audit-001',
      session_id: null,
      patient_id: patientId,
      doctor_id: null,
      clinic_name: 'MediPass Sandbox',
      action: 'GUEST_STARTED',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      metadata: { role: 'guest_patient' },
      prev_hash: null,
      current_hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b'
    }
  ];

  return {
    patient: userPatient,
    doctor: userDoctor,
    doctorProfile,
    medicalRecords,
    consentSessions: [],
    auditLogs,
    chatThreads: [],
    chatMessages: [],
    emergencySessions: []
  };
}

export default { createGuestSeed };
