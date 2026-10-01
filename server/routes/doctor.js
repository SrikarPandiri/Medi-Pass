/**
 * @file server/routes/doctor.js
 * @description Doctor clinical portal routes: camera scan verification,
 * scoped patient records viewing, post-consultation record submission, and recent patient recents.
 */

import { Router } from 'express';
import crypto from 'crypto';
import { authDoctor } from '../middleware/authDoctor.js';
import { consentService } from '../services/consentService.js';
import repository from '../db/repository.js';
import { AuditService } from '../services/auditService.js';

const router = Router();

// Protect doctor routes
router.use(authDoctor);

/**
 * Current doctor profile
 */
router.get('/me', (req, res) => {
  res.json({
    doctor: req.doctor,
    isGuest: req.isGuest
  });
});

/**
 * Scan patient QR code
 */
router.post('/scan', async (req, res, next) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) {
      return res.status(400).json({ error: { code: 'MISSING_QR_TOKEN', message: 'QR token payload is required.' } });
    }

    const consultationData = await consentService.verifyAndConsume(
      qrToken,
      req.doctor.user_id,
      req.guestId
    );

    res.json(consultationData);
  } catch (err) {
    next(err);
  }
});

/**
 * Create a new clinical consultation record (prescription / diagnosis / lab note)
 */
router.post('/records', async (req, res, next) => {
  try {
    const { patient_id, record_type, title, content } = req.body;
    if (!patient_id || !record_type || !title || !content) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'patient_id, record_type, title, and content are required.' }
      });
    }

    const record = {
      record_id: `rec-${crypto.randomUUID()}`,
      patient_id,
      record_type,
      title,
      content,
      created_at: new Date().toISOString(),
      clinic_name: req.doctor.clinic_name || 'Clinical Care',
      doctor_id: req.doctor.user_id,
      sync_status: 'SYNCED'
    };

    const saved = await repository.addRecord(record, req.guestId);

    await AuditService.log('RECORD_CREATED', {
      patient_id,
      doctor_id: req.doctor.user_id,
      clinic_name: req.doctor.clinic_name,
      metadata: { record_id: record.record_id, record_type, title }
    }, req.guestId);

    res.status(201).json({ record: saved });
  } catch (err) {
    next(err);
  }
});

/**
 * Get recent patients consulted in the past 24 hours
 */
router.get('/recent', (req, res, next) => {
  try {
    const doctorId = req.doctor.user_id;
    const since = new Date(Date.now() - 24 * 3600000).toISOString();

    let logs = [];
    if (req.guestId) {
      const sb = repository.getGuestSandbox(req.guestId);
      logs = (sb?.auditLogs || []).filter(l => l.action === 'QR_SCANNED' || l.action === 'RECORD_CREATED');
    } else {
      logs = repository.state.auditLogs.filter(
        l => l.doctor_id === doctorId && (l.action === 'QR_SCANNED' || l.action === 'RECORD_CREATED') && l.timestamp >= since
      );
    }

    const patientMap = new Map();
    for (const log of logs) {
      if (log.patient_id && !patientMap.has(log.patient_id)) {
        const p = repository.findUserById(log.patient_id, req.guestId);
        if (p) {
          patientMap.set(log.patient_id, {
            patient_id: p.user_id,
            name: p.name,
            abha_id: p.abha_id,
            last_seen: log.timestamp,
            action: log.action
          });
        }
      }
    }

    res.json({ recent: Array.from(patientMap.values()) });
  } catch (err) {
    next(err);
  }
});

export default router;
