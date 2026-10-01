-- ============================================================================
-- MediPass: Production PostgreSQL Relational Schema
-- Architecture: Patient-Held, Consent-Driven Point-of-Care Health Record
-- Compliant with ABDM (Ayushman Bharat Digital Mission) milestones & DPDP Act
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'guest_patient', 'guest_doctor')),
    phone_number VARCHAR(20) UNIQUE,
    email VARCHAR(255),
    abha_id VARCHAR(50),
    avatar_url TEXT,
    language_pref VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (language_pref IN ('en', 'hi', 'te', 'ta', 'kn')),
    emergency_contact_phone VARCHAR(20),
    ai_consent BOOLEAN NOT NULL DEFAULT FALSE,
    is_guest BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_abha ON users(abha_id);

-- 2. PATIENT CREDENTIALS
CREATE TABLE IF NOT EXISTS patient_credentials (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    pin_hash VARCHAR(255),
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ
);

-- 3. DOCTOR CREDENTIALS
CREATE TABLE IF NOT EXISTS doctor_credentials (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    license_id VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    clinic_name VARCHAR(255) NOT NULL,
    clinic_city VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'suspended')),
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_doctor_license ON doctor_credentials(license_id);

-- 4. AUTH SESSIONS
CREATE TABLE IF NOT EXISTS auth_sessions (
    auth_session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL,
    device_id VARCHAR(255),
    refresh_token_hash VARCHAR(255) NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(refresh_token_hash);

-- 5. MEDICAL RECORDS
CREATE TABLE IF NOT EXISTS medical_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('Prescription', 'Allergy', 'Lab Report', 'Diagnosis', 'BloodGroup', 'Vitals')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- Serialized JSON ciphertext or structured encrypted payload
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    clinic_name VARCHAR(255),
    doctor_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    sync_status VARCHAR(30) NOT NULL DEFAULT 'SYNCED' CHECK (sync_status IN ('PENDING_SYNC', 'SYNCED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_records_type ON medical_records(record_type);

-- 6. CONSENT SESSIONS
CREATE TABLE IF NOT EXISTS consent_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    qr_token TEXT NOT NULL,
    jti VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'revoked', 'expired')),
    scopes JSONB NOT NULL DEFAULT '["allergies", "prescriptions", "lab_reports", "vitals", "full_history"]',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consumed_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_consent_patient ON consent_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_jti ON consent_sessions(jti);
CREATE INDEX IF NOT EXISTS idx_consent_status ON consent_sessions(status);

-- 7. AUDIT LOGS (Hash-chained, tamper-evident log)
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    patient_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    clinic_name VARCHAR(255),
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'PATIENT_LOGIN', 'DOCTOR_LOGIN', 'GUEST_STARTED', 'QR_SCANNED', 
        'RECORD_VIEWED', 'RECORD_CREATED', 'ACCESS_REVOKED', 
        'BREAK_GLASS_TRIGGERED', 'JOHN_DOE_CREATED', 'JOHN_DOE_LINKED', 
        'TOKEN_REPLAY_BLOCKED', 'AI_ACCESSED_RECORDS', 'AI_CONSENT_GRANTED', 
        'AI_CONSENT_REVOKED', 'AI_EMERGENCY_FLAGGED'
    )),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}',
    prev_hash VARCHAR(64),
    current_hash VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_patient ON audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

-- 8. EMERGENCY SESSIONS
CREATE TABLE IF NOT EXISTS emergency_sessions (
    emergency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(30) NOT NULL CHECK (type IN ('BREAK_GLASS', 'JOHN_DOE')),
    doctor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    license_id VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    linked_patient_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    chart JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_doctor ON emergency_sessions(doctor_id);

-- 9. CHAT THREADS
CREATE TABLE IF NOT EXISTS chat_threads (
    thread_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'te', 'ta', 'kn')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_patient ON chat_threads(patient_id);

-- 10. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES chat_threads(thread_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    input_mode VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (input_mode IN ('text', 'voice')),
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    sources JSONB NOT NULL DEFAULT '[]', -- Array of record_ids referenced
    flags JSONB NOT NULL DEFAULT '[]',   -- e.g. ["emergency", "refused", "allergy_warning"]
    feedback VARCHAR(10) CHECK (feedback IN ('up', 'down', NULL)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id);

-- 11. GUEST SESSIONS
CREATE TABLE IF NOT EXISTS guest_sessions (
    guest_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(30) NOT NULL CHECK (role IN ('guest_patient', 'guest_doctor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    state JSONB NOT NULL -- In-memory or temporary sandbox state
);
