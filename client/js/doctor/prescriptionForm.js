/**
 * @file client/js/doctor/prescriptionForm.js
 * @description Post-consultation record form: prescription drafting with drug, dose,
 * frequency, duration, lab notes, and "Snap & Extract" OCR auto-fill integration.
 */

import { Api } from '../shared/api.js';
import { Toast } from '../shared/toast.js';
import { BottomSheet } from '../shared/sheet.js';
import { SyncManager } from '../core/syncManager.js';

export class PrescriptionForm {
  static open(patientId, onRecordCreated) {
    const contentHtml = `
      <form id="consultation-form" class="space-y-3.5 text-xs">
        <!-- Snap & Extract OCR Banner -->
        <div class="bg-blue-500/10 border border-blue-500/25 p-3 rounded-2xl flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">📷</span>
            <div>
              <p class="font-bold text-blue-700 dark:text-blue-300">Snap & Extract OCR</p>
              <p class="text-[10px] text-[var(--text-muted)]">Upload physical prescription photo to auto-fill</p>
            </div>
          </div>
          <button type="button" id="btn-snap-extract" class="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition">
            Scan Photo
          </button>
          <input type="file" id="file-snap-prescription" accept="image/*" class="hidden" />
        </div>

        <!-- Diagnosis Field -->
        <div>
          <label class="block font-bold text-[var(--text)] mb-1">Clinical Diagnosis</label>
          <input type="text" id="form-diagnosis" placeholder="e.g. Type 2 Diabetes Mellitus" required class="w-full p-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] outline-none focus:border-blue-500 transition" />
        </div>

        <!-- Medication Fields -->
        <div class="p-3 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] space-y-2">
          <p class="font-bold text-[var(--text)]">Prescription Details</p>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] text-[var(--text-muted)] mb-0.5">Drug Name</label>
              <input type="text" id="form-drug-name" placeholder="e.g. Metformin HCl" required class="w-full p-2 rounded-lg bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] outline-none" />
            </div>
            <div>
              <label class="block text-[10px] text-[var(--text-muted)] mb-0.5">Dosage</label>
              <input type="text" id="form-dosage" placeholder="e.g. 500 mg" required class="w-full p-2 rounded-lg bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] outline-none" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] text-[var(--text-muted)] mb-0.5">Frequency</label>
              <input type="text" id="form-frequency" placeholder="e.g. Twice daily after meals" required class="w-full p-2 rounded-lg bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] outline-none" />
            </div>
            <div>
              <label class="block text-[10px] text-[var(--text-muted)] mb-0.5">Duration</label>
              <input type="text" id="form-duration" placeholder="e.g. 90 days" required class="w-full p-2 rounded-lg bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-[10px] text-[var(--text-muted)] mb-0.5">Special Instructions</label>
            <input type="text" id="form-instructions" placeholder="Take with water after dinner" class="w-full p-2 rounded-lg bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] outline-none" />
          </div>
        </div>

        <!-- Clinical Notes -->
        <div>
          <label class="block font-bold text-[var(--text)] mb-1">Doctor's Clinical Notes / Advice</label>
          <textarea id="form-notes" rows="2" placeholder="Lifestyle modifications, dietary guidance..." class="w-full p-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] outline-none"></textarea>
        </div>

        <button type="submit" id="btn-save-consultation" class="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition">
          Sign & Save Consultation Record
        </button>
      </form>
    `;

    BottomSheet.open({
      title: 'New Consultation Record',
      contentHtml,
      onRender: (body, closeSheet) => {
        // Snap & Extract OCR trigger
        const fileInput = body.querySelector('#file-snap-prescription');
        body.querySelector('#btn-snap-extract')?.addEventListener('click', () => {
          fileInput?.click();
        });

        fileInput?.addEventListener('change', async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          Toast.info('Extracting handwritten / printed entities...');
          try {
            const formData = new FormData();
            formData.append('image', file);

            const res = await Api.post('/api/ocr/extract', formData);
            const ext = res.extracted_data;

            // Auto-fill fields with green highlight
            const diagInput = body.querySelector('#form-diagnosis');
            const drugInput = body.querySelector('#form-drug-name');
            const doseInput = body.querySelector('#form-dosage');
            const freqInput = body.querySelector('#form-frequency');
            const durInput = body.querySelector('#form-duration');
            const notesInput = body.querySelector('#form-notes');

            if (diagInput && ext.diagnosis) {
              diagInput.value = ext.diagnosis;
              diagInput.classList.add('bg-emerald-500/10', 'border-emerald-500');
            }
            if (ext.medications && ext.medications.length > 0) {
              const med = ext.medications[0];
              if (drugInput) { drugInput.value = med.name; drugInput.classList.add('bg-emerald-500/10', 'border-emerald-500'); }
              if (doseInput) { doseInput.value = med.dose; doseInput.classList.add('bg-emerald-500/10', 'border-emerald-500'); }
              if (freqInput) { freqInput.value = med.frequency; freqInput.classList.add('bg-emerald-500/10', 'border-emerald-500'); }
              if (durInput) { durInput.value = med.duration; durInput.classList.add('bg-emerald-500/10', 'border-emerald-500'); }
            }
            if (notesInput && ext.doctor_notes) {
              notesInput.value = ext.doctor_notes;
              notesInput.classList.add('bg-emerald-500/10', 'border-emerald-500');
            }

            Toast.success('Extracted! Please verify details before saving.');
          } catch (err) {
            Toast.error('OCR Extraction failed: ' + err.message);
          }
        });

        // Form Submit
        body.querySelector('#consultation-form')?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const diagnosis = body.querySelector('#form-diagnosis')?.value.trim();
          const drugName = body.querySelector('#form-drug-name')?.value.trim();
          const dosage = body.querySelector('#form-dosage')?.value.trim();
          const frequency = body.querySelector('#form-frequency')?.value.trim();
          const duration = body.querySelector('#form-duration')?.value.trim();
          const instructions = body.querySelector('#form-instructions')?.value.trim();
          const notes = body.querySelector('#form-notes')?.value.trim();

          const recordData = {
            patient_id: patientId,
            record_type: 'Prescription',
            title: `${drugName} ${dosage}`,
            content: {
              diagnosis,
              medication_name: drugName,
              dosage,
              frequency,
              duration,
              instructions,
              doctor_notes: notes,
              prescribed_at: new Date().toISOString()
            }
          };

          // Check if offline
          if (!navigator.onLine) {
            await SyncManager.enqueue('CREATE_RECORD', recordData);
            Toast.warning('Saved to Offline Sync Queue (PENDING_SYNC). Will sync on reconnect.');
            closeSheet();
            if (onRecordCreated) onRecordCreated({ ...recordData, record_id: `offline-${Date.now()}` });
            return;
          }

          try {
            const res = await Api.post('/api/doctor/records', recordData);
            Toast.success('Consultation record created successfully.');
            closeSheet();
            if (onRecordCreated) onRecordCreated(res.record);
          } catch (err) {
            Toast.error(err.message || 'Failed to save record.');
          }
        });
      }
    });
  }
}

export default PrescriptionForm;
