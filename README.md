# MediPass (మెడిపాస్)
### Patient-Held, Consent-Driven Point-of-Care Health Record & Dynamic QR Access System
*Engineered for India's Primary Healthcare Ecosystem (PHCs, Community Clinics, District Hospitals)*

🌐 **Live Demo:** [https://medipass-xyo6.onrender.com/](https://medipass-xyo6.onrender.com/)

> ⏳ Hosted on Render. Tap **"Continue as Guest"** on either app for instant access, no sign-up needed.

---

## 1. Overview
Patient medical records in India are predominantly fragmented across paper files and disconnected clinic software, causing duplicate diagnostics, missed drug allergy warnings, and fatal medication conflicts. Small primary healthcare clinics (PHCs) find national desktop software too heavyweight and cumbersome for rapid outpatient flow.

**MediPass** solves this by putting complete ownership of verified clinical records in the patient's smartphone. Doctors gain instant camera-scan access in **under 3 seconds**, patients retain real-time **kill-switch revocation**, offline emergency access is guaranteed via local cryptographic signatures and **Break-Glass protocols**, and patients can converse with a **multilingual AI health assistant** in Telugu, Hindi, Tamil, Kannada, or English grounded strictly in their own medical records.

---

## 2. Hard Constraints & Architectural Standards
- **Zero TypeScript:** Standard ECMAScript 2024 modules (`"type": "module"`), clean JSDoc annotations throughout.
- **Two Segregated Apps:** Completely separated Patient App (`/patient/login.html`) and Doctor App (`/doctor/login.html`) with distinct JWT secrets, audience claims (`medipass-patient` vs `medipass-doctor`), and UI accent tokens.
- **Full Light & Dark Theme Support:** Every single screen, chart, sheet, and camera scanner operates seamlessly in both light and dark modes with zero-flash rendering.
- **Runs Out of the Box:** Requires only `npm install && npm start`. No external database, Redis, or cloud AI key required. Default mode runs on an embedded file-backed repository and local clinical mock AI engine.
- **Isolated Guest Mode:** One-tap entry on both apps to an isolated in-memory sandbox. Real production records and external gateways are never touched.

---

## 3. Demo Credentials

| Role | Identifier | Password / PIN | Description & Seed Data |
|---|---|---|---|
| **Patient** | `9876543210` | PIN: `1234`<br/>*(OTP in Dev Banner)* | **Lakshmi Devi (68 yrs, Telugu)**. ABHA: `91-2345-6789-0123`. Blood Group O+, **Severe Penicillin Allergy (Anaphylaxis Risk)**, Type 2 Diabetes, Metformin & Amlodipine prescriptions, elevated HbA1c (7.8%), vitals history. |
| **Patient** | `9123456780` | PIN: `5678`<br/>*(OTP in Dev Banner)* | **Rahul Sharma (34 yrs, English/Hindi)**. ABHA: `91-8899-7766-5544`. Seasonal bronchial asthma, Budecort-F inhaler, CBC blood count. |
| **Doctor** | License: `TSMC-12345` | `Doctor@123` | **Dr. Anita Rao**, General Medicine & Diabetology, Sunrise Clinic, Hyderabad. Verified NMC status. |
| **Doctor** | License: `APMC-67890` | `Doctor@456` | **Dr. Ravi Kumar**, Critical Care & Emergency, District General Hospital, Guntur. Verified NMC status. |
| **Guest Patient** | *Tap "Continue as Guest"* | *No credentials needed* | **Asha Sharma (45 yrs)**. In-memory sandbox clone with 15+ records, Thyroid condition, Vitamin D deficiency, full AI assistant. |
| **Guest Doctor** | *Tap "Continue as Guest"* | *No credentials needed* | **Dr. Guest**, Demo Primary Health Centre. Includes one-tap demo scan button for solo judges. |

---

## 4. Setup & Running

### Try it online (no setup)
- **Live App:** [https://medipass-xyo6.onrender.com/](https://medipass-xyo6.onrender.com/)
- **Patient Portal:** [https://medipass-xyo6.onrender.com/patient/login.html](https://medipass-xyo6.onrender.com/patient/login.html)
- **Doctor Portal:** [https://medipass-xyo6.onrender.com/doctor/login.html](https://medipass-xyo6.onrender.com/doctor/login.html)
- **Side-by-Side Dual Demo Runner:** [https://medipass-xyo6.onrender.com/split.html](https://medipass-xyo6.onrender.com/split.html)

### Run locally

```bash
# 1. Clone repository & install dependencies
npm install

# 2. Start MediPass local server
npm start

# 3. (Optional) Run automated architecture test suite
npm test
```

Server endpoints will be active at:
- **Landing & Split-Screen Demo:** [http://localhost:3000](http://localhost:3000)
- **Patient Portal:** [http://localhost:3000/patient/login.html](http://localhost:3000/patient/login.html)
- **Doctor Portal:** [http://localhost:3000/doctor/login.html](http://localhost:3000/doctor/login.html)
- **Side-by-Side Dual Demo Runner:** [http://localhost:3000/split.html](http://localhost:3000/split.html)

---

## 5. 4-Minute Hackathon Demo Script

> You can follow this script on the [live demo](https://medipass-xyo6.onrender.com/) or locally at `http://localhost:3000`.

### Minute 0:00 – 1:00 | Instant Evaluation via Guest Mode & Multilingual AI
1. Open [https://medipass-xyo6.onrender.com/patient/login.html](https://medipass-xyo6.onrender.com/patient/login.html) (or [http://localhost:3000/patient/login.html](http://localhost:3000/patient/login.html)).
2. Tap the amber card: **"Continue as Guest"** (Zero typing, instant sandbox launch).
3. Observe the Instagram-style story rings (Blood Group B+, Allergies, Medicines) and health snapshot sparkline cards.
4. Tap the **Ask AI (Sparkle)** tab in the bottom bar.
5. In the top-right language picker, select **తెలుగు (Telugu)**.
6. Tap the suggestion chip: *"నా తాజా HbA1c ల్యాబ్ రిపోర్టును వివరించండి"*.
7. Watch the assistant stream a grounded reply token-by-token in Telugu explaining that HbA1c is monitored.
8. Tap **🔊 Listen** to hear browser SpeechSynthesis read it aloud in Telugu.

### Minute 1:00 – 2:00 | Real Patient Login & Rolling 45s QR
1. Open a new tab or use the Split-Screen helper at `/split.html`.
2. Go to `/patient/login.html`, click the **Demo Credentials** dropdown, and tap **Fill** on Lakshmi Devi (`9876543210`).
3. Tap **Get OTP** (simulated code appears in dev banner and terminal). Tap **Verify & Proceed** (or enter PIN `1234`).
4. On Home, tap the **Raised Center QR Button**.
5. Observe the rolling QR code with the **45s animated countdown ring**. Point out that each cycle mints a new single-use `jti` to prevent replay attacks.

### Minute 2:00 – 3:00 | Doctor Scan, High-Alert Allergy, & Instant Kill-Switch
1. On the Doctor side (`/doctor/login.html`), tap **Fill** on Dr. Anita Rao (`TSMC-12345` / `Doctor@123`) and log in.
2. Tap the **Scan QR** raised tab.
3. Tap **"📷 Scan Demo Patient QR Code"** (or scan camera directly).
4. Notice the record loads in **< 400 ms** with a badge: `Loaded in 380ms`.
5. Point out the flashing **🚨 Red High-Alert Allergy Banner: "Severe Penicillin Allergy (Anaphylaxis Risk)"**.
6. Switch back to the Patient's screen and tap the red button: **"Revoke Access (Kill-Switch)"**.
7. **Notice:** Within ~100ms, the Doctor's screen is immediately locked out and blanked via WebSocket broadcast (`SESSION_REVOKED`).

### Minute 3:00 – 4:00 | Offline Prescription Sync & Emergency Break-Glass
1. In the Doctor app, navigate to **#emergency**.
2. Tap **Break-Glass**: enter Lakshmi's phone `9876543210`, enter emergency justification (*"Unconscious acute trauma arrival from accident"*), re-enter doctor password `Doctor@123`.
3. Tap **Trigger Emergency Override**:
   - Immutable `BREAK_GLASS_TRIGGERED` audit log is written.
   - Mock SMS alert is dispatched to emergency contact `+919876543299`.
   - Doctor screen displays restricted view (Blood Group O+ and Severe Penicillin Allergy) with a **strict 60-second server countdown**, automatically wiping records when the timer hits zero.
4. In Doctor Consultation Form, show **"Snap & Extract"** OCR auto-filling handwritten medication fields.

---

## 6. Architecture & Security Model

```
                    ┌──────────────────────────────────────────────┐
                    │               PATIENT CLIENT                 │
                    │   IndexedDB (AES-GCM Cache) · Web Crypto     │
                    │   ECDSA P-256 Offline Keys · Web Speech API  │
                    └──────────────────────┬───────────────────────┘
                                           │
                        Rolling QR (45s)   │   SSE AI Stream
                        JWT (jti, scopes)  │   Redacted Context
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                           MEDIPASS NODE.JS CORE                               │
│                                                                               │
│  [TokenService]          [ConsentService]         [SafetyGuard]               │
│  - patient secret        - 45s cycle rotation     - 108/112 emergency cards   │
│  - doctor secret         - JTI anti-replay check  - dose modification refusal │
│  - guest secret          - Live kill switch       - penicillin conflict alert │
│                                                   - prompt injection defense  │
│  [AuditService]          [WebSocket Hub]                                      │
│  - SHA-256 hash chained  - instant blank-screen   [AI Provider Adapter]       │
│  - tamper-evident logs     SESSION_REVOKED        - MockProvider (grounded)   │
│                          - AUDIT_EVENT stream     - OpenAI / Gemini / Claude  │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
                    Scoped Clinical    │   Break-Glass (60s)
                    Records < 3s       │   Trauma Charts
                                       ▼
                    ┌──────────────────────────────────────────────┐
                    │                DOCTOR CLIENT                 │
                    │   Camera Scanner · Prescription Form + OCR   │
                    │   Offline Queue (PENDING_SYNC) · Recents     │
                    └──────────────────────────────────────────────┘
```

---

## 7. Known Limitations & Production Hardening

1. **Digital Personal Data Protection (DPDP) Act Compliance:**
   - In production, data fiduciary requirements mandate explicit consent logs with verifiable timestamps and cryptographic proofs before transmitting any clinical context to third-party LLM providers (e.g. OpenAI or Gemini).
   - The current prototype runs by default on `mockProvider`, ensuring zero clinical data leaves the local server boundary.
2. **Clinical Safety & Medical Device Validation:**
   - The assistant is built with guardrails (refusing dose alterations, rejecting symptom self-diagnosis, and detecting acute emergencies). In a clinical deployment, LLM outputs must be validated through formal clinical safety evaluations (e.g. SaMD / CDSCO guidelines in India).
3. **ABDM (Ayushman Bharat Digital Mission) Integration:**
   - Production systems must register as an ABDM Health Information Provider (HIP) and Health Information User (HIU) using the national gateway APIs (M1, M2, M3 milestones) for authenticating ABHA numbers with Aadhaar/Mobile OTP.
4. **Zero-Knowledge Key Exchange:**
   - The prototype simulates client envelope encryption. In full production, each patient holds an asymmetric key pair inside hardware-backed secure storage (Android Keystore / iOS Secure Enclave) so that medical record ciphertext is indecipherable by the server.
