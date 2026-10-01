/**
 * @file server/routes/ocr.js
 * @description OCR Prescription Digitizer endpoint accepting image upload or base64 data.
 */

import { Router } from 'express';
import multer from 'multer';
import { OcrService } from '../services/ocrService.js';

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB
const router = Router();

/**
 * Snap & Extract OCR endpoint
 */
router.post('/extract', upload.single('image'), async (req, res, next) => {
  try {
    let imageBuffer = null;
    let mimeType = 'image/jpeg';

    if (req.file) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
    } else if (req.body.imageBase64) {
      const parts = req.body.imageBase64.split(';base64,');
      if (parts.length === 2) {
        mimeType = parts[0].replace('data:', '');
        imageBuffer = Buffer.from(parts[1], 'base64');
      } else {
        imageBuffer = Buffer.from(req.body.imageBase64, 'base64');
      }
    }

    const result = await OcrService.extractPrescription(imageBuffer, mimeType);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
