/**
 * @file client/js/patient/qr.js
 * @description Patient rolling dynamic QR code initiator.
 */

import { QrModal } from '../components/qrModal.js';

export class PatientQr {
  static open(patientId) {
    QrModal.open(patientId);
  }
}

export default PatientQr;
