/**
 * @file server/services/auditService.js
 * @description Hash-chained audit logging service ensuring tamper-evidence and traceability.
 */

import repository from '../db/repository.js';
import { wsHub } from '../ws/hub.js';

export class AuditService {
  /**
   * Records an audit log entry and notifies connected patient WebSocket clients
   */
  static async log(action, { session_id = null, patient_id = null, doctor_id = null, clinic_name = 'MediPass System', metadata = {} } = {}, guestId = null) {
    const entry = await repository.addAuditLog({
      session_id,
      patient_id,
      doctor_id,
      clinic_name,
      action,
      metadata
    }, guestId);

    if (patient_id) {
      wsHub.broadcastToPatient(patient_id, 'AUDIT_EVENT', entry);
    }

    return entry;
  }

  /**
   * Retrieves audit trail for a patient
   */
  static getAuditTrail(patientId, guestId = null) {
    return repository.getAuditLogsByPatientId(patientId, guestId);
  }
}

export default AuditService;
