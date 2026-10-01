/**
 * @file server/db/seed.js
 * @description Comprehensive realistic seed data for MediPass (patients, doctors, clinical records, audit history).
 */

import bcrypt from 'bcryptjs';

/**
 * Creates seed dataset with hashed credentials and structured medical records
 * @returns {Promise<object>} Complete seed state
 */
export async function createSeedData() {
  const pin1234Hash = await bcrypt.hash('1234', 10);
  const pin5678Hash = await bcrypt.hash('5678', 10);
  const docAnitaHash = await bcrypt.hash('Doctor@123', 10);
  const docRaviHash = await bcrypt.hash('Doctor@456', 10);

  const users = [
    {
      user_id: 'p-lakshmi-001',
      name: 'Lakshmi Devi',
      role: 'patient',
      phone_number: '9876543210',
      email: 'lakshmi.devi@example.com',
      abha_id: '91-2345-6789-0123',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      language_pref: 'te',
      emergency_contact_phone: '+919876543299',
      ai_consent: true,
      is_guest: false,
      created_at: new Date(Date.now() - 90 * 86400000).toISOString()
    },
    {
      user_id: 'p-rahul-002',
      name: 'Rahul Sharma',
      role: 'patient',
      phone_number: '9123456780',
      email: 'rahul.sharma@example.com',
      abha_id: '91-8899-7766-5544',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      language_pref: 'en',
      emergency_contact_phone: '+919123456799',
      ai_consent: true,
      is_guest: false,
      created_at: new Date(Date.now() - 60 * 86400000).toISOString()
    },
    {
      user_id: 'd-anita-101',
      name: 'Dr. Anita Rao',
      role: 'doctor',
      phone_number: '9988776655',
      email: 'dr.anita@sunriseclinic.in',
      abha_id: 'DOC-TS-443322',
      avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
      language_pref: 'en',
      emergency_contact_phone: null,
      ai_consent: false,
      is_guest: false,
      created_at: new Date(Date.now() - 180 * 86400000).toISOString()
    },
    {
      user_id: 'd-ravi-102',
      name: 'Dr. Ravi Kumar',
      role: 'doctor',
      phone_number: '9977553311',
      email: 'dr.ravi@districthospital.gov.in',
      abha_id: 'DOC-AP-998811',
      avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
      language_pref: 'te',
      emergency_contact_phone: null,
      ai_consent: false,
      is_guest: false,
      created_at: new Date(Date.now() - 240 * 86400000).toISOString()
    }
  ];

  const patientCredentials = [
    {
      user_id: 'p-lakshmi-001',
      pin_hash: pin1234Hash,
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString()
    },
    {
      user_id: 'p-rahul-002',
      pin_hash: pin5678Hash,
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString()
    }
  ];

  const doctorCredentials = [
    {
      user_id: 'd-anita-101',
      license_id: 'TSMC-12345',
      password_hash: docAnitaHash,
      clinic_name: 'Sunrise Clinic, Banjara Hills',
      clinic_city: 'Hyderabad',
      specialization: 'General Medicine & Diabetology',
      verification_status: 'verified',
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString()
    },
    {
      user_id: 'd-ravi-102',
      license_id: 'APMC-67890',
      password_hash: docRaviHash,
      clinic_name: 'District General Hospital',
      clinic_city: 'Guntur',
      specialization: 'Emergency Medicine & Critical Care',
      verification_status: 'verified',
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString()
    }
  ];

  const medicalRecords = [
    // Lakshmi's 12 structured records
    {
      record_id: 'rec-lak-001',
      patient_id: 'p-lakshmi-001',
      record_type: 'BloodGroup',
      title: 'Blood Group Confirmation',
      content: {
        blood_group: 'O+',
        rh_factor: 'Positive',
        verified_by: 'State Blood Transfusion Council'
      },
      created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
      clinic_name: 'District Hospital, Guntur',
      doctor_id: 'd-ravi-102',
      sync_status: 'SYNCED'
    },
    {
      record_id: 'rec-lak-002',
      patient_id: 'p-lakshmi-001',
      record_type: 'Allergy',
      title: 'Severe Penicillin Allergy',
      content: {
        allergen: 'Penicillin & Beta-Lactam Antibiotics',
        severity: 'Severe / Anaphylaxis',
        reaction: 'Generalized urticaria, bronchospasm, facial angioedema',
        notes: 'Strictly avoid Amoxicillin, Ampicillin, Piperacillin, and first-gen cephalosporins.'
      },
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
      clinic_name: 'Sunrise Clinic, Hyderabad',
      doctor_id: 'd-anita-101',
      sync_status: 'SYNCED'
    },
    {
      record_id: 'rec-lak-003',
      patient_id: 'p-lakshmi-001',
      record_type: 'Diagnosis',
      title: 'Type 2 Diabetes Mellitus',
      content: {
        code: 'ICD-10 E11',
        description: 'Type 2 diabetes mellitus without acute complications. Managed with oral hypoglycemic agents.',
        onset: '2021',
        status: 'Active'
      },
      created_at: new Date(Date.now() - 75 * 86400000).toISOString(),
      clinic_name: 'Sunrise Clinic, Hyderabad',
      doctor_id: 'd-anita-101',
      sync_status: 'SYNCED'
    },
    {
      record_id: 'rec-lak-004',
      patient_id: 'p-lakshmi-001',
      record_type: 'Diagnosis',
      title: 'Essential Hypertension (Stage 1)',
      content: {
        code: 'ICD-10 I10',
        description: 'Essential primary hypertension. Well tolerated on monotherapy.',
        status: 'Active'
      },
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      clinic_name: 'Sunrise Clinic, Hyderabad',
      doctor_id: 'd-anita-101',
      sync_status: 'SYNCED'
    },
    {
      record_id: 'rec-lak-005',
      patient_id: 'p-lakshmi-001',
      record_type: 'Prescription',
      title: 'Metformin 500mg Tablets',
      content: {
        medication_name: 'Metformin Hydrochloride',
        dosage: '500 mg',
        frequency: 'Twice daily (after breakfast & dinner)',
        duration: '90 days',
        instructions: 'Take strictly with or after meals to minimize stomach upset. Do not skip doses.',
        prescribed_date: new Date(Date.now() - 14 * 86400000).toISOString()
      },
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      clinic_name: 'Sunrise Clinic, Hyderabad',
      doctor_id: 'd-anita-101',
      sync_status: 'SYNCED'
    },
    {
      record_id: 'rec-lak-006',
      patient_id: 'p-lakshmi-001',
      record_type: 'Prescription',
      title: 'Amlodipine 5mg Tablets',
      content: {
        medication_name: 'Amlodipine Besylate',
        dosage: '5 mg',
        frequency: 'Once daily (morning)',
        duration: '90 days',
        instructions: 'Take in the morning with water. Monitor for mild ankle swelling.',
        prescribed_date: new Date(Date.now() - 14 * 86400000).toISOString()
      },
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      clinic_name: 'Sunrise Clinic, Hyderabad',
      doctor_id: 'd-anita-101',
      sync_status: 'SYNCED'
    },
    {
      record_id: 'rec-lak-007',
      patient_id: 'p-lakshmi-001',
      record_type: 'Lab Report',
      title: 'Glycated Hemoglobin (HbA1c)',
      content: {
        test_name: 'Glycated Hemoglobin (HbA1c)',
        value: 7.8,
        unit: '%',
        reference_range: '< 5.7% (Normal), 5.7-6.4% (Prediabetic), >= 6.5% (Diabetic)',
        status: 'High',
        clinical_note: 'Moderately elevated. Diabetic glycemic control requires continued dietary adherence.'
      },
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      clinic_name: 'Apollo Diagnostics Centre, Hyderabad',
      doctor_id: 'd-anita-101',
      sync_status: 'SYNCED'
    },
    {
      record_id: 'rec-lak-008',
      patient_id: 'p-lakshmi-001',
      record_type: 'Lab Report',
      title: 'Fasting Plasma Glucose (FPG)',
      content: {
        test_name: 'Fasting Blood Sugar',
        value: 148,
        unit: 'mg/dL',
        reference_range: '70 - 99 mg/dL (Normal), 100 - 125 mg/dL (Impaired)',
        status: 'High',
        clinical_note: 'Fasting level is elevated above target baseline of 130 mg/dL.'
      },
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      clinic_name: 'Apollo Diagnostics Centre, Hyderabad',
      doctor_id: 'd-anita-101',
      sync_status: 'SYNCED'
    },
    {
      record_id: 'rec-lak-009',
      patient_id: 'p-lakshmi-001',
      record_type: 'Lab Report',
      title: 'Comprehensive Lipid Profile',
      content: {
        test_name: 'Lipid Panel',
        total_cholesterol: { value: 215, unit: 'mg/dL', ref: '< 200 mg/dL (Desirable)', status: 'Borderline High' },
        ldl_cholesterol: { value: 135, unit: 'mg/dL', ref: '< 100 mg/dL (Optimal)', status: 'Elevated' },
        hdl_cholesterol: { value: 48, unit: 'mg/dL', ref: '> 40 mg/dL (Normal)', status: 'Normal' },
        triglycerides: { value: 160, unit: 'mg/dL', ref: '< 150 mg/dL (Normal)', status: 'Borderline' },
        status: 'Borderline High'
      },
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      clinic_name: 'Apollo Diagnostics Centre, Hyderabad',
      doctor_id: 'd-anita-101',
      sync_status: 'SYNCED'
    },
    {
      record_id: 'rec-lak-010',
      patient_id: 'p-lakshmi-001',
      record_type: 'Lab Report',
      title: 'Kidney Function Test (Serum Creatinine)',
      content: {
        test_name: 'Serum Creatinine',
        value: 0.9,
        unit: 'mg/dL',
        reference_range: '0.6 - 1.1 mg/dL',
        status: 'Normal',
        clinical_note: 'Renal clearance intact. Safe for continuing Metformin.'
      },
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      clinic_name: 'Apollo Diagnostics Centre, Hyderabad',
      doctor_id: 'd-anita-101',
      sync_status: 'SYNCED'
    },
    {
      record_id: 'rec-lak-011',
      patient_id: 'p-lakshmi-001',
      record_type: 'Vitals',
      title: 'Clinical Vitals Examination',
      content: {
        blood_pressure: '138/86 mmHg',
        pulse: '74 bpm',
        spo2: '98%',
        temperature: '98.4 F',
        notes: 'BP is mildly elevated; heart rhythm regular.'
      },
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      clinic_name: 'Sunrise Clinic, Hyderabad',
      doctor_id: 'd-anita-101',
      sync_status: 'SYNCED'
    },
    {
      record_id: 'rec-lak-012',
      patient_id: 'p-lakshmi-001',
      record_type: 'Vitals',
      title: 'Anthropometric Measurements',
      content: {
        weight: '64 kg',
        height: '160 cm',
        bmi: '25.0 kg/m²',
        status: 'Borderline Overweight'
      },
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      clinic_name: 'Sunrise Clinic, Hyderabad',
      doctor_id: 'd-anita-101',
      sync_status: 'SYNCED'
    },

    // Rahul's records
    {
      record_id: 'rec-rah-001',
      patient_id: 'p-rahul-002',
      record_type: 'BloodGroup',
      title: 'Blood Group Confirmation',
      content: {
        blood_group: 'B+',
        rh_factor: 'Positive'
      },
      created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
      clinic_name: 'District General Hospital',
      doctor_id: 'd-ravi-102',
      sync_status: 'SYNCED'
    },
    {
      record_id: 'rec-rah-002',
      patient_id: 'p-rahul-002',
      record_type: 'Diagnosis',
      title: 'Bronchial Asthma (Seasonal/Extrinsic)',
      content: {
        code: 'ICD-10 J45',
        description: 'Intermittent seasonal exacerbations triggered by pollen and dust.'
      },
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
      clinic_name: 'Sunrise Clinic, Hyderabad',
      doctor_id: 'd-anita-101',
      sync_status: 'SYNCED'
    },
    {
      record_id: 'rec-rah-003',
      patient_id: 'p-rahul-002',
      record_type: 'Prescription',
      title: 'Budesonide + Formoterol Inhaler',
      content: {
        medication_name: 'Budecort-F 200 Inhaler',
        dosage: '1 puff',
        frequency: 'Twice daily & as needed for wheezing',
        duration: '60 days',
        instructions: 'Rinse mouth thoroughly with water after inhalation.'
      },
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      clinic_name: 'Sunrise Clinic, Hyderabad',
      doctor_id: 'd-anita-101',
      sync_status: 'SYNCED'
    },
    {
      record_id: 'rec-rah-004',
      patient_id: 'p-rahul-002',
      record_type: 'Lab Report',
      title: 'Complete Blood Count (CBC)',
      content: {
        test_name: 'CBC Hemogram',
        hemoglobin: { value: 15.2, unit: 'g/dL', status: 'Normal' },
        wbc_count: { value: 7400, unit: '/cumm', status: 'Normal' },
        eosinophils: { value: 6.2, unit: '%', status: 'Mildly Elevated (Allergic)' },
        status: 'Normal'
      },
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      clinic_name: 'City Care Diagnostics',
      doctor_id: 'd-anita-101',
      sync_status: 'SYNCED'
    }
  ];

  const auditLogs = [
    {
      log_id: 'audit-001',
      session_id: null,
      patient_id: 'p-lakshmi-001',
      doctor_id: null,
      clinic_name: 'System Portal',
      action: 'PATIENT_LOGIN',
      timestamp: new Date(Date.now() - 30 * 86400000).toISOString(),
      metadata: { method: 'OTP', device: 'Mobile Browser' },
      prev_hash: null,
      current_hash: 'c83f9801a2dbce4472c9165b40cf392a83e020272faecf9119c629e472621101'
    },
    {
      log_id: 'audit-002',
      session_id: 'sess-init-01',
      patient_id: 'p-lakshmi-001',
      doctor_id: 'd-anita-101',
      clinic_name: 'Sunrise Clinic, Hyderabad',
      action: 'QR_SCANNED',
      timestamp: new Date(Date.now() - 14 * 86400000).toISOString(),
      metadata: { scopes: ['allergies', 'prescriptions', 'lab_reports'] },
      prev_hash: 'c83f9801a2dbce4472c9165b40cf392a83e020272faecf9119c629e472621101',
      current_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    {
      log_id: 'audit-003',
      session_id: 'sess-init-01',
      patient_id: 'p-lakshmi-001',
      doctor_id: 'd-anita-101',
      clinic_name: 'Sunrise Clinic, Hyderabad',
      action: 'RECORD_VIEWED',
      timestamp: new Date(Date.now() - 14 * 86400000 + 4000).toISOString(),
      metadata: { record_count: 8, load_time_ms: 420 },
      prev_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      current_hash: '1b4f0e985197199f8da09d573d377c85ff8677c32014a683fe672ec00e470ee3'
    },
    {
      log_id: 'audit-004',
      session_id: 'sess-init-01',
      patient_id: 'p-lakshmi-001',
      doctor_id: 'd-anita-101',
      clinic_name: 'Sunrise Clinic, Hyderabad',
      action: 'RECORD_CREATED',
      timestamp: new Date(Date.now() - 14 * 86400000 + 120000).toISOString(),
      metadata: { record_type: 'Prescription', title: 'Metformin 500mg Tablets' },
      prev_hash: '1b4f0e985197199f8da09d573d377c85ff8677c32014a683fe672ec00e470ee3',
      current_hash: '7c6a527232e0e0a137ce51a8f8458ca3f80961f0094770177b9ab1d8ee1c3a6e'
    },
    {
      log_id: 'audit-005',
      session_id: null,
      patient_id: 'p-lakshmi-001',
      doctor_id: null,
      clinic_name: 'MediPass Assistant',
      action: 'AI_CONSENT_GRANTED',
      timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
      metadata: { user_action: 'ACCEPTED_IN_APP' },
      prev_hash: '7c6a527232e0e0a137ce51a8f8458ca3f80961f0094770177b9ab1d8ee1c3a6e',
      current_hash: 'a9b2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e7f809'
    },
    {
      log_id: 'audit-006',
      session_id: null,
      patient_id: 'p-lakshmi-001',
      doctor_id: null,
      clinic_name: 'MediPass Assistant',
      action: 'AI_ACCESSED_RECORDS',
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      metadata: { record_ids: ['rec-lak-005', 'rec-lak-007'], topic: 'HbA1c & Medication Review' },
      prev_hash: 'a9b2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e7f809',
      current_hash: 'ff00aa112233445566778899aabbccddeeff00112233445566778899aabbccdd'
    }
  ];

  return {
    users,
    patientCredentials,
    doctorCredentials,
    authSessions: [],
    medicalRecords,
    consentSessions: [],
    auditLogs,
    emergencySessions: [],
    chatThreads: [
      {
        thread_id: 'thread-lak-001',
        patient_id: 'p-lakshmi-001',
        title: 'Medication and Sugar Review',
        language: 'te',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        archived: false
      }
    ],
    chatMessages: [
      {
        message_id: 'msg-001',
        thread_id: 'thread-lak-001',
        role: 'user',
        content: 'నా మధుమేహం మరియు మందుల గురించి వివరాలు చెప్పండి',
        input_mode: 'text',
        language: 'te',
        sources: [],
        flags: [],
        feedback: null,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        message_id: 'msg-002',
        thread_id: 'thread-lak-001',
        role: 'assistant',
        content: `నమస్కారం లక్ష్మి గారు! మీ ఆరోగ్య రికార్డులను పరిశీలించాను:\n\n1. **షుగర్ వివరాలు (HbA1c):** మీ తాజా HbA1c స్థాయి **7.8%** గా ఉంది (సాధారణంగా ఉండాల్సిన స్థాయి 5.7% కంటే తక్కువ). ఇది మధుమేహాన్ని సూచిస్తుంది.\n2. **మందులు:** మీకు డాక్టర్ అనిత గారు **Metformin 500mg** మందును ఉదయం మరియు రాత్రి భోజనం తర్వాత తీసుకోవాలని సూచించారు.\n3. **ముఖ్యమైన హెచ్చరిక:** మీకు **పెన్సిలిన్ (Penicillin)** మందులకు తీవ్రమైన అలర్జీ ఉంది. డాక్టర్లను సంప్రదించినప్పుడు ఈ విషయాన్ని తప్పక తెలియజేయండి.\n\nఏదైనా అసౌకర్యం అనిపిస్తే వెంటనే మీ వైద్యులను సంప్రదించండి.`,
        input_mode: 'text',
        language: 'te',
        sources: ['rec-lak-002', 'rec-lak-005', 'rec-lak-007'],
        flags: ['allergy_warning'],
        feedback: 'up',
        created_at: new Date(Date.now() - 2 * 86400000 + 3000).toISOString()
      }
    ],
    guestSessions: []
  };
}

export default { createSeedData };
