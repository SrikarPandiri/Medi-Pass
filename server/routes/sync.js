/**
 * @file server/routes/sync.js
 * @description Offline data synchronization endpoint with idempotency protection,
 * translation utilities, and developer SMS outbox inspection.
 */

import { Router } from 'express';
import repository from '../db/repository.js';
import { AuditService } from '../services/auditService.js';
import { smsService } from '../services/smsService.js';
import { TranslateService } from '../services/translateService.js';

const router = Router();

// In-memory idempotency cache: idempotencyKey -> processed response
const idempotencyMap = new Map();

/**
 * Sync offline batch queue
 */
router.post('/sync', async (req, res, next) => {
  try {
    const { items = [], idempotencyKey } = req.body;

    if (idempotencyKey && idempotencyMap.has(idempotencyKey)) {
      return res.json(idempotencyMap.get(idempotencyKey));
    }

    const syncedItems = [];

    for (const item of items) {
      if (item.action === 'CREATE_RECORD' && item.record) {
        const record = {
          ...item.record,
          sync_status: 'SYNCED',
          synced_at: new Date().toISOString()
        };

        // Check if already exists
        const existing = (repository.state.medicalRecords || []).find(r => r.record_id === record.record_id);
        if (!existing) {
          await repository.addRecord(record);
          await AuditService.log('RECORD_CREATED', {
            patient_id: record.patient_id,
            clinic_name: record.clinic_name,
            metadata: { record_id: record.record_id, method: 'BACKGROUND_SYNC' }
          });
        }
        syncedItems.push({ id: record.record_id, status: 'SYNCED' });
      }
    }

    const result = {
      success: true,
      syncedCount: syncedItems.length,
      items: syncedItems,
      timestamp: new Date().toISOString()
    };

    if (idempotencyKey) {
      idempotencyMap.set(idempotencyKey, result);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Utility translation endpoint
 */
router.post('/translate', async (req, res, next) => {
  try {
    const { text, target_lang } = req.body;
    if (!text) {
      return res.status(400).json({ error: { code: 'MISSING_TEXT', message: 'Text to translate is required.' } });
    }

    const translated = await TranslateService.translate(text, target_lang || 'en');
    res.json({ original: text, translated, target_lang: target_lang || 'en' });
  } catch (err) {
    next(err);
  }
});

/**
 * Developer SMS outbox inspection
 */
router.get('/dev/sms-outbox', (req, res) => {
  res.json({
    outbox: smsService.getOutbox(50)
  });
});

export default router;
