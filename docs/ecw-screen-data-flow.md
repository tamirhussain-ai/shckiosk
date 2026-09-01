# IU Student Check-In: eCW Screen Data Flow

**Status:** Implementation mapping  
**Scope:** Production kiosk flow in `artifacts/iu-student-checkin` and the native server adapter in `artifacts/api-server`  
**Important:** This document describes the current implementation. The native eCW request fields and response formats still require validation against an approved eCW test environment.

## Executive summary

The kiosk browser does **not** connect directly to eCW. Every screen communicates with the API server. The API server then chooses one of two adapters:

1. **Mock mode** — the default; uses deterministic sample data and in-memory state.
2. **Native eCW mode** — server-side only; sends requests to eCW and uses a scoped MySQL store for questionnaires and consent.

The native adapter keeps eCW credentials, registration keys, cookies, patient identifiers, and database credentials on the server. The browser receives only the shared `CheckInSession` and `CompletionResult` API shapes.

```text
Kiosk screen
    |
    | JSON over the shared API
    v
API server route
    |
    +--> Native eCW HTTP adapter
    |       POST formData/XML to eCW
    |       server-side cookie jar
    |
    +--> Direct eCW MySQL store
            questionnaire and consent reads/writes

    or

    +--> Mock adapter
            deterministic fixtures and in-memory state
```

## Screen and request summary

| Kiosk screen | Browser/API request | Native eCW HTTP action | Direct MySQL activity | What is written |
|---|---|---|---|---|
| Welcome / identification | `POST /api/checkin/sessions` | Staff authentication, `validateUser`, `getPatientEncounters` | None | Creates a server-side check-in session |
| Legacy verification endpoint | `POST /api/checkin/sessions/:sessionId/verify` | No native eCW call in the current implementation | None | Only compatibility state |
| Contact details | `PATCH /api/checkin/sessions/:sessionId/demographics` | `updateDemographics` | None | Patient contact/address fields |
| Appointment / visit | `PATCH /api/checkin/sessions/:sessionId/appointment` | `appntCheckIn` | Loads encounter consent and questionnaire requirements | Selected appointment and encounter context |
| Coverage | `PATCH /api/checkin/sessions/:sessionId/coverage` | `saveInsurance` | None | Coverage selection and, when applicable, insurance fields |
| Insurance card capture | `POST /api/checkin/sessions/:sessionId/insurance-card/ocr` | None | None | No eCW write; returns bounded OCR fields for review |
| Consent | `POST /api/checkin/sessions/:sessionId/consent` | None | Reads recurrence/signature state and inserts into `sigInfo` when needed | Signed consent |
| Questionnaire list/detail | `POST /api/checkin/sessions/:sessionId/questionnaire` | None | Reads design/submission data and upserts `questionnairedata` | Questionnaire answers |
| Checking / finalization | `POST /api/checkin/sessions/:sessionId/complete` | `checkIn` | None | Final check-in status |
| Complete | No additional request | None | None | Displays the server completion response |

The current kiosk does not render a separate history screen. The API and adapters contain a `saveHistory` operation, but `CheckInFlow` does not currently call it.

## Common request envelope

The browser sends JSON to the API server. The browser never receives the native eCW URL or sends eCW credentials.

For native eCW HTTP requests, `EcwHttpClient` sends a server-side `POST` to:

```text
ECW_HOST + ECW_KIOSK_PATH
```

The form body contains:

```text
frmPurpose=<native action>
formData=<XML built from the action values>
activationCode=<server-side activation code>
```

The server also sends the configured registration key in the `rk` and `x-ecw-registration-key` headers, plus the activation code header. Cookies returned by eCW are kept in a session-specific server-side cookie jar and reused for later requests.

## 1. Welcome / identification screen

### Information collected from the student

The student chooses one of:

- University ID plus date of birth
- Last name plus date of birth
- QR code

The production component sends:

```http
POST /api/checkin/sessions
Content-Type: application/json
```

Example shape:

```json
{
  "method": "universityId",
  "value": "<student-provided-id>",
  "dateOfBirth": "<student-provided-date>"
}
```

For QR mode, the request uses the QR method and token fields.

### Native eCW reads

The native adapter performs these server-side calls in order:

1. `kioskPracticeAuthentication`
2. `validateUser`
3. `getPatientEncounters`

#### 1. `kioskPracticeAuthentication`

The server sends the configured staff username, an eCW-compatible encrypted staff password, facility information, device information, host operating system information, and kiosk metadata.

The response is used to determine whether staff authentication succeeded, was rejected, or requires 2FA. A 2FA response currently stops native identification and reports that the staff challenge must be completed before using native check-in.

#### 2. `validateUser`

The server sends the identification method and the relevant student-provided values, along with the facility ID. The response is parsed for a patient/student identifier.

The adapter accepts common JSON and XML field names such as:

- `patientId`
- `universityId`
- `studentId`
- `uid`

#### 3. `getPatientEncounters`

The server sends the resolved patient identifier, the original identification values when applicable, date of birth, and facility ID.

The response populates the initial `CheckInSession`:

- student identity and demographics
- appointments/encounters
- insurance on file
- encounter identifiers

The session is retained server-side with an expiration timer. Native cookies and patient state are cleared when the session expires or completes.

### What is written

Identification does not write a patient record. It creates an in-memory server-side check-in session.

### Registration note

Device registration is a separate operational action using `registerKiosk`. It is not invoked by the welcome screen. The returned bound registration key must be stored through the approved server secret process; the kiosk should not perform registration during a student check-in.

## 2. Legacy verification endpoint

The API exposes:

```http
POST /api/checkin/sessions/:sessionId/verify
```

The current production native identification path sets `requiresVerification` to false because `validateUser` is the native patient-validation step. The endpoint remains for compatibility with older clients.

In native mode, the adapter only checks that the session exists and that the supplied code is six digits. It does not make another eCW request.

## 3. Contact details screen

### Information displayed

The screen is prefilled from the `CheckInSession` returned by identification:

- address line 1
- address line 2
- city
- state
- ZIP
- mobile phone

The verified identity summary also displays the name, university ID, and date of birth returned during identification.

### Browser/API request

```http
PATCH /api/checkin/sessions/:sessionId/demographics
Content-Type: application/json
```

Payload:

```json
{
  "addressLine1": "...",
  "addressLine2": "...",
  "city": "...",
  "state": "...",
  "zip": "...",
  "phone": "..."
}
```

### Native eCW write

The native adapter calls:

```text
updateDemographics
```

with:

- `patientId`
- `encounterId` when available
- `facId`
- `phone`
- `addressLine1`
- `addressLine2`
- `city`
- `state`
- `zip`

After eCW accepts the request, the server updates the session copy and invalidates downstream appointment, coverage, consent, questionnaire, and history state as appropriate.

## 4. Appointment / visit screen

### Information displayed

Appointments are not fetched by a separate appointment-screen request. They are returned as part of `getPatientEncounters` during identification.

The screen displays each returned appointment's:

- date
- time
- visit type
- provider
- location
- waiting-area/location details

If no appointment is returned, the screen presents a front-desk option and an optional online-scheduling handoff. Those choices are local kiosk behavior and do not write to eCW.

### Browser/API request

```http
PATCH /api/checkin/sessions/:sessionId/appointment
Content-Type: application/json
```

Payload:

```json
{
  "appointmentId": "<selected-appointment-id>"
}
```

### Native eCW write

The native adapter first calls:

```text
appntCheckIn
```

with:

- appointment ID
- encounter ID
- patient ID
- facility ID

### Direct MySQL reads after appointment selection

After the appointment is accepted, the native adapter loads encounter requirements through the scoped MySQL store. It uses the encounter and facility context to:

1. read the encounter's visit type from `enc`
2. find mapped questionnaire document types in `visittypequestportalmapping`
3. read questionnaire design rows from `questionnaireformdesign`
4. read prior questionnaire submissions from `questionnairedata`
5. read consent settings from `kioskSetting`
6. resolve consent type names from `consentFormType`
7. filter consents by visit type through `kioskconsentformvisittype`
8. filter consents by provider through `kioskconsentformprovider`
9. read recurrence rules from `kioskconsentrecurrence`
10. read prior accepted signatures from `sigInfo`

The resulting consent forms and questionnaires are returned to the browser as part of the updated session. The browser does not query MySQL directly.

## 5. Coverage screen

### Information displayed

Coverage choices are derived from `onFileInsuranceInformation` already present in the session:

- IU insurance, when usable insurance is on file
- another insurance plan
- self-pay

If no usable insurance is on file, the IU option is omitted and the student can add insurance or select self-pay.

The coverage screen does not make a separate read request to eCW.

### Browser/API request

```http
PATCH /api/checkin/sessions/:sessionId/coverage
Content-Type: application/json
```

Payload for IU insurance:

```json
{
  "coverage": "iu"
}
```

Payload for self-pay:

```json
{
  "coverage": "self"
}
```

Payload for another insurance plan:

```json
{
  "coverage": "other",
  "insuranceCarrier": "...",
  "memberId": "...",
  "groupNumber": "...",
  "subscriberName": "..."
}
```

Carrier, member ID, and subscriber name are required for `other`; group number is optional.

### Native eCW write

The native adapter calls:

```text
saveInsurance
```

with:

- patient ID
- encounter ID
- facility ID
- coverage choice
- insurance carrier
- member ID
- group number
- subscriber name

The server then updates the session's selected insurance information. Selecting IU uses the insurance on file, selecting self-pay clears the selected insurance information, and selecting another plan uses the reviewed values from the form.

## 6. Insurance card capture screen

Insurance capture is deliberately separate from questionnaire data.

### OCR request path

When the student captures or selects an insurance-card image, the browser may call:

```http
POST /api/checkin/sessions/:sessionId/insurance-card/ocr
Content-Type: application/json
```

The request contains a normalized JPEG image. The API server:

1. verifies that the check-in session may use the card reader
2. applies the OCR rate limit
3. validates and decodes the image
4. sends the image to Azure Document Intelligence when configured
5. returns only the approved, bounded insurance fields

Azure credentials remain server-side. This is **not an eCW request**.

If the server OCR path is unavailable, the kiosk falls back to its explicitly self-hosted on-device OCR assets. The student reviews and can edit every extracted field.

### What is written

Capturing an image or applying OCR results does not write to eCW. It only fills the local coverage form. The eventual `saveInsurance` request occurs when the student confirms coverage on the Coverage screen.

## 7. Consent screen

### Information displayed

Consent forms are returned in the session after appointment selection. In native mode they come from the direct MySQL store, not from an eCW questionnaire servlet request.

Each form includes:

- consent form ID
- title
- exact description text
- signature requirement
- signed/unsigned status

The kiosk requires the student to scroll through each form before enabling agreement and signature.

### Browser/API request

```http
POST /api/checkin/sessions/:sessionId/consent
Content-Type: application/json
```

Payload:

```json
{
  "accepted": true,
  "formId": "<consent-form-id>",
  "signatureData": "data:image/jpeg;base64,<jpeg-data>"
}
```

The signature must be a validated JPEG data URL. The native path does not accept a typed signature as the production signature representation.

### Direct MySQL read-before-write

Before inserting a signature, the store checks:

- recurrence rules in `kioskconsentrecurrence`
- prior accepted signatures in `sigInfo`

If the prior signature is still within the configured recurrence period, a duplicate signature is not inserted.

### Native write

Consent is written directly to the scoped MySQL database, not through an eCW HTTP action.

The store inserts into `sigInfo` with:

- patient/student UID
- exact consent description snapshot
- JPEG bytes without the data URL prefix
- signed timestamp
- consent form ID
- accepted flag

The write is protected by a database lock keyed to the student and consent form so concurrent submissions do not create duplicate records.

## 8. Questionnaire list and detail screens

### Information displayed

The questionnaire list is populated from the session returned after appointment selection. Each questionnaire has a status such as:

- not started
- completed during this kiosk visit
- completed online

The detail screen displays the mapped eCW design rows, preserving the eCW question IDs, option IDs, page/order metadata, mandatory state, parent IDs, and trigger relationships.

Conditional visibility is calculated from the parent question's selected answer. A child question's option IDs are used only to validate the child's own answer.

### Browser/API request

When a student saves a questionnaire:

```http
POST /api/checkin/sessions/:sessionId/questionnaire
Content-Type: application/json
```

Payload:

```json
{
  "questionnaireId": "<questionnaire-id>",
  "questionnaireName": "<questionnaire-name>",
  "answers": {
    "<eCW-question-id>": "<eCW-option-id-or-text>"
  }
}
```

The server validates:

- question IDs belong to the selected questionnaire
- mandatory visible questions have answers
- selected option IDs belong to their own question
- numeric answers are numeric
- answer lengths are bounded

### Native write

Questionnaire answers are written directly to `questionnairedata`. The store:

1. identifies each questionnaire page
2. filters out hidden questions
3. serializes answers to eCW-style XML values such as:

```xml
<IN_8463>30711</IN_8463>
```

4. checks whether the student/encounter/document/page row already exists
5. updates the existing row or inserts a new row
6. records completion metadata, source `Kiosk`, timestamp, last question, and language code

The write is protected by a database lock keyed to the student, encounter, questionnaire, and page.

### What is not used

The native questionnaire save does not call an eCW questionnaire servlet endpoint. It uses the direct-storage path to avoid depending on unvalidated questionnaire servlet behavior.

## 9. Checking / finalization screen

The Checking screen is a transient loading state displayed while the browser waits for:

```http
POST /api/checkin/sessions/:sessionId/complete
```

The server first verifies that:

- an appointment has been selected
- all required consent forms are signed
- all encounter questionnaires are complete
- the session is at a valid final stage

### Native eCW write

The native adapter calls:

```text
checkIn
```

with:

- patient ID
- encounter ID
- appointment ID
- facility ID

After a successful response, the server destroys the session and clears its patient, encounter, appointment, questionnaire, consent, and cookie state.

## 10. Complete screen

The Complete screen makes no additional eCW request. It renders the `CompletionResult` returned by the API, including:

- provider
- visit type
- appointment time
- floor
- waiting area
- directions

The kiosk automatically resets after the configured completion timeout or when the student chooses to finish.

## Background requests that are not eCW

The kiosk also makes application-level requests that are unrelated to eCW:

```http
GET /api/health
GET /api/kiosk/content
```

These provide the system status indicator and editable kiosk content. They do not read or write patient information in eCW.

## Mock mode behavior

Mock mode preserves the same browser/API contract but does not call eCW or MySQL:

- identification returns deterministic student, appointment, and insurance fixtures
- appointment selection applies fixture-specific encounter requirements
- consent and questionnaire state are kept in memory
- finalization returns fixture-based directions

This is the recommended mode for normal UI and workflow development.

## Native safety boundary

Native eCW mode should remain disabled until an approved IU-network validation environment is available. Validation should occur in this order:

1. device registration
2. staff authentication and 2FA behavior
3. one read-only patient/encounter lookup using test data
4. questionnaire and consent reads
5. only then, controlled writes against disposable test encounters

The current implementation can test native request formatting and adapter behavior with injected fake responses, but only a reachable approved eCW environment can validate firewall access, vendor-specific field names, registration behavior, password/encryption compatibility, and actual response semantics.

## Source map

- Production screen flow: `artifacts/iu-student-checkin/src/components/checkin/CheckInFlow.tsx`
- Insurance capture/OCR UI: `artifacts/iu-student-checkin/src/components/checkin/InsuranceCardCapture.tsx`
- API routes: `artifacts/api-server/src/routes/checkin.ts`
- Adapter selection and mock behavior: `artifacts/api-server/src/lib/checkin-adapter.ts`
- Native eCW adapter: `artifacts/api-server/src/lib/ecw/ecw-checkin-adapter.ts`
- eCW HTTP envelope and cookie handling: `artifacts/api-server/src/lib/ecw/ecw-http-client.ts`
- Staff authentication: `artifacts/api-server/src/lib/ecw/ecw-staff-auth.ts`
- Device registration: `artifacts/api-server/src/lib/ecw/ecw-registration.ts`
- Direct questionnaire/consent store: `artifacts/api-server/src/lib/ecw/ecw-questionnaire-consent-store.ts`
- Questionnaire mapping: `artifacts/api-server/src/lib/ecw/ecw-questionnaire-mapper.ts`
- CSV-backed master questionnaire fixture: `artifacts/api-server/src/lib/ecw/master-questionnaire-fixture.ts`