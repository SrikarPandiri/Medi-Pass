/**
 * @file client/js/components/activityItem.js
 * @description Audit timeline notification item showing who accessed what, when, and where.
 */

export class ActivityItem {
  static actionIcons = {
    'PATIENT_LOGIN': { icon: '🔑', label: 'Patient Login', color: 'text-teal-500' },
    'DOCTOR_LOGIN': { icon: '🩺', label: 'Doctor Login', color: 'text-blue-500' },
    'QR_SCANNED': { icon: '📷', label: 'QR Scanned by Doctor', color: 'text-emerald-500' },
    'RECORD_VIEWED': { icon: '👁️', label: 'Records Viewed', color: 'text-indigo-500' },
    'RECORD_CREATED': { icon: '📝', label: 'New Record Created', color: 'text-teal-600' },
    'ACCESS_REVOKED': { icon: '🛑', label: 'Access Revoked (Kill Switch)', color: 'text-rose-600' },
    'BREAK_GLASS_TRIGGERED': { icon: '🚨', label: 'Emergency Break-Glass', color: 'text-red-600' },
    'AI_ACCESSED_RECORDS': { icon: '🤖', label: 'AI Read Records (Consent)', color: 'text-purple-600' },
    'AI_CONSENT_GRANTED': { icon: '✨', label: 'AI Consent Granted', color: 'text-purple-500' },
    'AI_CONSENT_REVOKED': { icon: '🔒', label: 'AI Consent Revoked', color: 'text-slate-500' },
    'TOKEN_REPLAY_BLOCKED': { icon: '🛡️', label: 'Replay Attack Blocked', color: 'text-amber-500' }
  };

  static render(log) {
    const meta = this.actionIcons[log.action] || { icon: '📋', label: log.action, color: 'text-slate-500' };
    const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' · ' + new Date(log.timestamp).toLocaleDateString();

    let details = '';
    if (log.metadata) {
      if (log.metadata.record_count) details = `Scanned ${log.metadata.record_count} scoped records (${log.metadata.load_time_ms || 420} ms)`;
      else if (log.metadata.reason) details = `Reason: "${log.metadata.reason}"`;
      else if (log.metadata.count) details = `AI examined ${log.metadata.count} records for question grounding`;
      else if (log.metadata.method) details = `Method: ${log.metadata.method}`;
    }

    return `
      <div class="flex items-start gap-3 p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] mb-2.5 shadow-sm">
        <div class="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-lg flex-shrink-0">
          ${meta.icon}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-xs text-[var(--text)]">${meta.label}</h4>
            <span class="text-[10px] text-[var(--text-subtle)]">${timeFormatted}</span>
          </div>
          <p class="text-xs text-[var(--text-muted)] mt-0.5">Facility: <strong>${log.clinic_name || 'Clinical Care'}</strong></p>
          ${details ? `<p class="text-[11px] text-[var(--text-subtle)] mt-1 bg-[var(--surface-2)] p-1.5 rounded-lg">${details}</p>` : ''}
          <div class="mt-1.5 text-[9px] text-slate-400 font-mono truncate" title="SHA-256 Hash: ${log.current_hash}">
            Hash: ${log.current_hash.slice(0, 16)}...
          </div>
        </div>
      </div>
    `;
  }
}

export default ActivityItem;
