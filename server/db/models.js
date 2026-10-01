/**
 * @file server/db/models.js
 * @description JSDoc data models and schema definitions for MediPass.
 */

/**
 * @typedef {'patient'|'doctor'|'guest_patient'|'guest_doctor'} UserRole
 * @typedef {'en'|'hi'|'te'|'ta'|'kn'} SupportedLanguage
 * @typedef {'Prescription'|'Allergy'|'Lab Report'|'Diagnosis'|'BloodGroup'|'Vitals'} MedicalRecordType
 * @typedef {'active'|'consumed'|'revoked'|'expired'} ConsentStatus
 * @typedef {'PENDING_SYNC'|'SYNCED'|'FAILED'} SyncStatus
 * @typedef {'user'|'assistant'|'system'} ChatMessageRole
 * @typedef {'text'|'voice'} InputMode
 */

/**
 * @typedef {Object} User
 * @property {string} user_id - Primary unique identifier (UUID)
 * @property {string} name - Full user name
 * @property {UserRole} role - Role of user
 * @property {string} [phone_number] - Mobile phone number (+91 format)
 * @property {string} [email] - Email address
 * @property {string} [abha_id] - Ayushman Bharat Health Account ID (e.g. 14-digit or @abdm)
 * @property {string} [avatar_url] - Profile image avatar URL
 * @property {SupportedLanguage} language_pref - Preferred UI/Speech language
 * @property {string} [emergency_contact_phone] - Emergency contact mobile number
 * @property {boolean} ai_consent - Patient consent granted for AI to read health records
 * @property {boolean} is_guest - True if user is a guest/sandbox user
 * @property {string} created_at - ISO timestamp
 * @property {string} [updated_at] - ISO timestamp
 */

/**
 * @typedef {Object} PatientCredentials
 * @property {string} user_id - Foreign key to User
 * @property {string} pin_hash - Bcrypt hashed 4-6 digit PIN
 * @property {number} failed_attempts - Counter for failed logins
 * @property {string|null} locked_until - ISO timestamp of lockout expiry
 * @property {string} [last_login_at] - ISO timestamp
 */

/**
 * @typedef {Object} DoctorCredentials
 * @property {string} user_id - Foreign key to User
 * @property {string} license_id - Medical Council Registration / License ID
 * @property {string} password_hash - Bcrypt hashed password
 * @property {string} clinic_name - Medical practice / hospital name
 * @property {string} clinic_city - City of practice
 * @property {string} specialization - Specialty (e.g. General Medicine, Cardiology)
 * @property {'pending'|'verified'|'suspended'} verification_status - State/National council status
 * @property {number} failed_attempts - Counter for failed logins
 * @property {string|null} locked_until - ISO timestamp of lockout expiry
 * @property {string} [last_login_at] - ISO timestamp
 */

/**
 * @typedef {Object} AuthSession
 * @property {string} auth_session_id - Session identifier
 * @property {string} user_id - User identifier
 * @property {UserRole} role - User role
 * @property {string} [device_id] - Device identifier
 * @property {string} refresh_token_hash - SHA-256 hash of active refresh token
 * @property {string} [user_agent] - Client user agent string
 * @property {string} created_at - ISO timestamp
 * @property {string} expires_at - ISO timestamp
 * @property {boolean} revoked - Revocation flag
 */

/**
 * @typedef {Object} MedicalRecord
 * @property {string} record_id - Unique record ID
 * @property {string} patient_id - ID of patient
 * @property {MedicalRecordType} record_type - Category of health record
 * @property {string} title - Human readable record title
 * @property {string|object} content - Serialized encrypted ciphertext or structured data
 * @property {string} created_at - ISO timestamp
 * @property {string} [clinic_name] - Issuing clinic or hospital name
 * @property {string} [doctor_id] - Issuing doctor user ID
 * @property {SyncStatus} sync_status - Synchronization state
 */

/**
 * @typedef {Object} ConsentSession
 * @property {string} session_id - Consent session UUID
 * @property {string} patient_id - Patient giving consent
 * @property {string|null} doctor_id - Bound doctor user ID once scanned
 * @property {string} qr_token - Signed JWT representation
 * @property {string} jti - Unique token identifier to prevent replays
 * @property {ConsentStatus} status - Lifecycle state
 * @property {string[]} scopes - Permitted record scopes (e.g. ['allergies', 'prescriptions'])
 * @property {string} expires_at - ISO timestamp (typically 45s from creation)
 * @property {string} created_at - ISO timestamp
 * @property {string|null} [consumed_at] - ISO timestamp when doctor verified
 * @property {string|null} [revoked_at] - ISO timestamp if patient killed session
 */

/**
 * @typedef {Object} AuditLog
 * @property {string} log_id - Unique audit log entry ID
 * @property {string|null} session_id - Associated consent or emergency session ID
 * @property {string|null} patient_id - Patient involved
 * @property {string|null} doctor_id - Doctor involved
 * @property {string} [clinic_name] - Clinic where action occurred
 * @property {string} action - Action code (e.g. 'QR_SCANNED', 'BREAK_GLASS_TRIGGERED')
 * @property {string} timestamp - ISO timestamp
 * @property {Record<string, any>} metadata - Contextual metadata (without raw PII)
 * @property {string|null} prev_hash - SHA-256 hash of previous audit log
 * @property {string} current_hash - SHA-256 hash over log_id, action, timestamp, metadata & prev_hash
 */

/**
 * @typedef {Object} EmergencySession
 * @property {string} emergency_id - Emergency session identifier
 * @property {'BREAK_GLASS'|'JOHN_DOE'} type - Type of emergency intervention
 * @property {string} doctor_id - Authenticated doctor user ID
 * @property {string} license_id - Verified medical license ID
 * @property {string} reason - Justification for emergency access (min 10 chars)
 * @property {string|null} linked_patient_id - Target patient ID (or linked post-hoc for John Doe)
 * @property {string} expires_at - Server-enforced expiration (60 seconds countdown)
 * @property {Record<string, any>} chart - Emergency chart details or vitals
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} ChatThread
 * @property {string} thread_id - Conversation thread UUID
 * @property {string} patient_id - Patient owner ID
 * @property {string} title - Conversation title
 * @property {SupportedLanguage} language - Active conversation language
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 * @property {boolean} archived - Archival status
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} message_id - Message UUID
 * @property {string} thread_id - Foreign key to ChatThread
 * @property {ChatMessageRole} role - 'user' | 'assistant' | 'system'
 * @property {string} content - Markdown text content
 * @property {InputMode} input_mode - 'text' | 'voice'
 * @property {SupportedLanguage} language - Language code
 * @property {string[]} sources - Array of medical record IDs cited in response
 * @property {string[]} flags - Safety flags (e.g. ['emergency', 'refused', 'allergy_warning'])
 * @property {'up'|'down'|null} feedback - Helpful rating
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} GuestSession
 * @property {string} guest_id - Guest session identifier
 * @property {'guest_patient'|'guest_doctor'} role - Guest role
 * @property {string} created_at - ISO timestamp
 * @property {string} expires_at - Expiry timestamp (2 hours)
 * @property {Record<string, any>} state - Isolated in-memory sandbox data
 */

export default {};
