/**
 * @file server/routes/emergency.js
 * @description Critical care and emergency routes: Break-Glass protocol with 60-second server-enforced
 * timer, emergency contact SMS dispatch, and John Doe trauma charts with retroactive linkage.
 */

import { Router } from 'express';
import crypto from 'crypto';
import { authDoctor } from '../middleware/authDoctor.js';
import repository from '../db/repository.js';
import { CryptoService } from '../services/cryptoService.js';
import { AuditService } from '../services/auditService.js';
import { smsService } from '../services/smsService.js';
import { breakGlassLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Protect emergency routes with authDoctor
router.use(authDoctor);

/**
 * Break-Glass Emergency Access (Blood Group & Severe Allergies only, 60s countdown)
 */
router.post('/break-glass', breakGlassLimiter, async (req, res, next) => {
  try {
    const { identifier, reason, password } = req.body;
    if (!identifier || !reason || !password) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'Patient identifier (phone or ABHA), clinical reason, and doctor password are required.' }
      });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({
        error: { code: 'INSUFFICIENT_REASON', message: 'Emergency reason must be descriptive (at least 10 characters).' }
      });
    }

    // Verify doctor password re-confirmation
    if (!req.isGuest) {
      const creds = repository.getDoctorCredentials(req.doctor.user_id);
      if (!creds) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Doctor credentials not found.' } });
      }
      const isPasswordValid = await CryptoService.compare(password, creds.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: { code: 'INVALID_PASSWORD', message: 'Password confirmation failed.' } });
      }
    }

    // Locate patient by phone or ABHA
    let patient = null;
    const cleanPhone = identifier.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length === 10) {
      patient = req.isGuest
        ? repository.getGuestSandbox(req.guestId)?.patient
        : repository.findUserByPhone(cleanPhone);
    }

    if (!patient) {
      if (req.isGuest) {
        patient = repository.getGuestSandbox(req.guestId)?.patient;
      } else {
        patient = repository.state.users.find(u => u.abha_id === identifier.trim());
      }
    }

    if (!patient) {
      return res.status(404).json({ error: { code: 'PATIENT_NOT_FOUND', message: 'No patient record found for identifier.' } });
    }

    // Retrieve ALL records, filter ONLY Blood Group and Severe Allergies
    const allRecords = repository.getRecordsByPatientId(patient.user_id, req.guestId);
    const emergencyRecords = allRecords.filter(r => r.record_type === 'BloodGroup' || r.record_type === 'Allergy');

    const emergencyId = `emg-${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString(); // 60 seconds strict

    const emergencySession = {
      emergency_id: emergencyId,
      type: 'BREAK_GLASS',
      doctor_id: req.doctor.user_id,
      license_id: req.doctor.license_id,
      reason: reason.trim(),
      linked_patient_id: patient.user_id,
      expires_at: expiresAt,
      chart: {
        viewed_types: ['BloodGroup', 'Allergy'],
        record_count: emergencyRecords.length
      },
      created_at: new Date().toISOString()
    };

    await repository.createEmergencySession(emergencySession, req.guestId);

    // Audit immutable Break Glass event
    await AuditService.log('BREAK_GLASS_TRIGGERED', {
      session_id: emergencyId,
      patient_id: patient.user_id,
      doctor_id: req.doctor.user_id,
      clinic_name: req.doctor.clinic_name,
      metadata: {
        reason: reason.trim(),
        license_id: req.doctor.license_id,
        emergency_id: emergencyId
      }
    }, req.guestId);

    // Send Alert SMS to Emergency Contact
    if (patient.emergency_contact_phone) {
      const smsBody = `EMERGENCY ALERT: Dr. ${req.doctor.name} (${req.doctor.license_id}) triggered emergency break-glass access for patient ${patient.name}. Reason: "${reason.trim()}". Access expires in 60 seconds.`;
      await smsService.sendSms(patient.emergency_contact_phone, smsBody, 'BREAK_GLASS');
    }

    res.json({
      emergency_id: emergencyId,
      patient: {
        name: patient.name,
        abha_id: patient.abha_id,
        emergency_contact_phone: patient.emergency_contact_phone
      },
      records: emergencyRecords,
      expires_at: expiresAt,
      countdown_seconds: 60,
      notice: 'Server-enforced 60s emergency window active. Access will automatically lock after countdown.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Initialize a John Doe (Unidentified Trauma Patient) Chart
 */
router.post('/john-doe', async (req, res, next) => {
  try {
    const { estimated_age, sex, identifying_marks, initial_vitals, triage_priority = 'RED' } = req.body;
    const emergencyId = `jd-${Date.now()}`;

    const johnDoeSession = {
      emergency_id: emergencyId,
      type: 'JOHN_DOE',
      doctor_id: req.doctor.user_id,
      license_id: req.doctor.license_id,
      reason: 'Unidentified unconscious emergency arrival',
      linked_patient_id: null,
      expires_at: new Date(Date.now() + 48 * 3600000).toISOString(),
      chart: {
        pseudonym: `John Doe #${emergencyId.slice(-4)}`,
        triage_priority,
        estimated_age: estimated_age || 'Unknown',
        sex: sex || 'Unknown',
        identifying_marks: identifying_marks || 'None noted',
        initial_vitals: initial_vitals || {},
        treatments: [
          {
            timestamp: new Date().toISOString(),
            administered_by: req.doctor.name,
            action: 'Trauma Bay Admission & Airway Assessment'
          }
        ]
      },
      created_at: new Date().toISOString()
    };

    await repository.createEmergencySession(johnDoeSession, req.guestId);

    await AuditService.log('JOHN_DOE_CREATED', {
      session_id: emergencyId,
      doctor_id: req.doctor.user_id,
      clinic_name: req.doctor.clinic_name,
      metadata: { emergency_id: emergencyId, triage: triage_priority }
    }, req.guestId);

    res.status(201).json({ emergency: johnDoeSession });
  } catch (err) {
    next(err);
  }
});

/**
 * Append treatment to John Doe chart
 */
router.post('/john-doe/:id/treatment', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { treatment_description, vitals_update } = req.body;

    const session = repository.findEmergencySessionById(id, req.guestId);
    if (!session || session.type !== 'JOHN_DOE') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'John Doe chart not found.' } });
    }

    const treatments = session.chart.treatments || [];
    treatments.push({
      timestamp: new Date().toISOString(),
      administered_by: req.doctor.name,
      description: treatment_description,
      vitals: vitals_update || null
    });

    session.chart.treatments = treatments;
    await repository.updateEmergencySession(id, { chart: session.chart }, req.guestId);

    res.json({ success: true, chart: session.chart });
  } catch (err) {
    next(err);
  }
});

/**
 * Retroactively link John Doe chart to permanent verified patient
 */
router.post('/john-doe/:id/link', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { patient_id, verification_method = 'FAMILY_ID' } = req.body;

    const session = repository.findEmergencySessionById(id, req.guestId);
    if (!session || session.type !== 'JOHN_DOE') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'John Doe chart not found.' } });
    }

    const patient = repository.findUserById(patient_id, req.guestId);
    if (!patient) {
      return res.status(404).json({ error: { code: 'PATIENT_NOT_FOUND', message: 'Target patient profile not found.' } });
    }

    session.linked_patient_id = patient_id;
    await repository.updateEmergencySession(id, { linked_patient_id: patient_id }, req.guestId);

    // Also convert trauma chart into permanent medical record
    const record = {
      record_id: `rec-jd-${Date.now()}`,
      patient_id,
      record_type: 'Diagnosis',
      title: `Trauma Chart (Linked from ${session.chart.pseudonym})`,
      content: session.chart,
      created_at: new Date().toISOString(),
      clinic_name: req.doctor.clinic_name,
      doctor_id: req.doctor.user_id,
      sync_status: 'SYNCED'
    };
    await repository.addRecord(record, req.guestId);

    await AuditService.log('JOHN_DOE_LINKED', {
      session_id: id,
      patient_id,
      doctor_id: req.doctor.user_id,
      clinic_name: req.doctor.clinic_name,
      metadata: { emergency_id: id, verification_method }
    }, req.guestId);

    res.json({ success: true, message: 'Trauma chart linked successfully to patient profile.' });
  } catch (err) {
    next(err);
  }
});

export default router;
