# Autibile App — Change Request Specs

> Implement every item below. File paths are relative to `c:\Users\IM\autibileApp`.

---

## CR1 — IC/MyKid/Passport → MyKad Label

**Goal:** Change the label of the IC number field in all three registration forms from "IC / MyKid / Passport" to "MyKad" (these are adults, not children).

### Files to Change

**File:** `app/auth/Register.tsx` (around line 274)

Change:
```jsx
// Label text
"IC / MyKid / Passport"
// Validation error message
"IC / MyKid / Passport is required and valid"
```
to:
```jsx
"MyKad"
"MyKad is required and must be 12 digits"
```

**File:** `app/auth/TherapistRegister.tsx` (around line 277)

Same changes as above — label and validation message.

**File:** `app/auth/DoctorRegister.tsx`

Same changes — label and validation message.

> Note: The field placeholder `"Example: 123456789012"` and the 12-character validation logic should stay unchanged.

---

## CR2 — Remove Username for Parents (App)

**Goal:** Parents no longer need to fill in a username. Remove the username field from the parent registration form. Stop displaying username as a greeting or in profile views; use full name instead.

### Parent Registration Form
**File:** `app/auth/Register.tsx`

1. Find and **delete** the username field block (around lines 228–240):
   - The `useState("")` for username
   - The `<TextInput>` or form field with label "Username"
   - The required validation check `!username` from the submit handler
   - Remove `username` from the data object sent to the registration API

2. In the API call payload, remove `username: username` (or equivalent).

### Registration API Call
The app calls `server/api/apps/registration/registerParents.post.js` (on the web server). That server route already accepts optional username — just stop sending it from the app.

### App Home Greeting
**File:** `app/parentsPage/index.tsx` (around lines 55, 67)

3. Change the greeting from using `parsedData.username` to `parsedData.fullName` or `parsedData.fullname`. For example:
   ```tsx
   // Before
   Good morning, {userName}!
   // After
   Good morning, {fullName}!
   ```
   Update the variable assignment accordingly.

### Profile Edit Page
**File:** `app/parentsPage/profileEdit.tsx` (around lines 96–97, 103)

4. Remove the username display from the profile card (avatar initial derived from username, and username shown as name in profile). Replace with full name instead:
   - Avatar initial: use `userData.fullName?.[0]` instead of `userData.username?.[0]`
   - Name label: use `userData.fullName` instead of `userData.username`

### Parent Profile Page
**File:** `app/profilePage/parentsProfile.tsx` (around lines 24, 178)

5. Remove `username` from the `ParentData` interface (or mark optional).
6. Do not render username anywhere on this page. If there's a field row showing "Username: xxx", remove it.

### Community Feed Author
**File:** `app/community-feed/addFeed.tsx` (around line 37)

7. Update the fallback chain:
   ```tsx
   // Before
   communityAuthor = userData.fullName || userData.fullname || userData.username || 'Unknown Author'
   // After
   communityAuthor = userData.fullName || userData.fullname || 'Unknown Author'
   ```
   (Remove the `userData.username` fallback since it will no longer be populated for new parents.)

---

## CR3 — Remove Username for Practitioners (App)

Same as CR2 but for therapist and doctor registrations.

**File:** `app/auth/TherapistRegister.tsx` (around lines 15, 236–247)

1. Delete the username field, its state, validation, and remove from API payload.
2. Update `app/therapistPage/index.tsx` (around lines 45, 54): change greeting from username to full name.
3. Update `app/therapistPage/profileEdit.tsx`: replace username with full name in avatar initial and name display.
4. Update `app/profilePage/practitionerProfile.tsx` (around lines 22, 143): remove username field from interface and display.

**File:** `app/auth/DoctorRegister.tsx`

5. Delete the username field, its state, validation, and remove from API payload.
6. Update `app/doctorPage/index.tsx` (around lines 36, 45): change greeting from username to full name.
7. Update `app/doctorPage/profileEdit.tsx`: replace username with full name in avatar and display.

---

## CR4 — Remove Nickname for Children (App)

**Goal:** Children no longer need a nickname. Remove from add-child form (required validation and asterisk), stop displaying nickname in any child list or detail views.

### Add Child Form
**File:** `app/profilePage/childProfile.tsx`

1. In the "Add New Child" modal (around line 361, the label `<Text style={styles.label}>Nickname *</Text>`):
   - **Delete** the entire nickname input field block (label + TextInput).
   - Remove `nickname` from `newChildData` state.
   - Remove `!newChildData.nickname` from the `handleCreateNewChild` validation check (around line 361–364).
   - Remove `nickname` from the API payload sent to `addChildren.post.js`.

2. In the child list rendering (around line 503, 569–573), remove any display of `(nickname)` next to the child's name.

3. In the edit child modal, remove the nickname input field (if present).

### Diary Report — Practitioner Patient Report
**File:** `app/diaryReport/practitionerPatientReport.tsx` (around lines 44, 110–112, 236–238)

4. Remove `"Nickname: {patientNickname}"` from the patient banner display.
5. Remove `patientNickname` from the component's props/interface if it's no longer used.

### Diary Report — Practitioner Report (List)
**File:** `app/diaryReport/practitionerReport.tsx` (around lines 25, 95, 112, 122, 168, 211–213)

6. Remove any rendering of nickname in the patient list items.
7. Remove nickname from the search/filter logic if it was being searched.

### Diary Report — Parents Report
**File:** `app/diaryReport/parentsReport.tsx` (around lines 391, 396)

8. Remove `childNickname` from the route params passed to the diary screen (if it's no longer needed). Update the receiving screen accordingly if you remove it.

---

## CR5 — Autism Diagnosis & Diagnosed Date: Not Required (App)

**Goal:** Autism Diagnosis and Diagnosed Date fields in the Add Child form must not show a required asterisk (*) and must not be validated as required.

**File:** `app/profilePage/childProfile.tsx`

1. Find the labels for these two fields in the Add New Child modal:
   - If either shows `<Text>Autism Diagnosis *</Text>` or `<Text>Diagnosed Date *</Text>`, remove the `*`.
   
2. Confirm that `handleCreateNewChild` (around lines 361–364) does NOT check `!newChildData.autismDiagnose` or `!newChildData.diagnosedDate`. If it does, remove those checks.

> According to the current code scan, these fields are already optional and have no asterisks. Verify this is still the case and make no changes if already correct.

---

## CR6 — Date Picker: Fix Dark/Light Mode on iOS

**Goal:** The date picker components use hardcoded light-mode colors (`#fff`, `#333`, `#E0E0E0`) which look broken on iOS in dark mode. Add theme-aware colors.

### DatePickerField
**File:** `components/DatePickerField.tsx`

1. Import `useColorScheme` at the top:
   ```tsx
   import { useColorScheme } from 'react-native';
   ```

2. Inside the component, get the current scheme:
   ```tsx
   const colorScheme = useColorScheme();
   const isDark = colorScheme === 'dark';
   ```

3. Define theme-aware color tokens:
   ```tsx
   const colors = {
     background: isDark ? '#1C1C1E' : '#FFFFFF',
     text: isDark ? '#FFFFFF' : '#333333',
     subtext: isDark ? '#AEAEB2' : '#666666',
     border: isDark ? '#3A3A3C' : '#E0E0E0',
     accent: '#24A8FF',
   };
   ```

4. Replace all hardcoded color values in this file:
   - `backgroundColor: "#fff"` → `backgroundColor: colors.background`
   - `color: "#666"` (cancel button) → `color: colors.subtext`
   - `color: "#24A8FF"` (done button) — keep as `colors.accent`
   - Any `color: "#333"` → `color: colors.text`

5. For the modal/bottom-sheet container, also set `backgroundColor: colors.background` and add `borderColor: colors.border` where applicable.

6. If the `DateTimePicker` component accepts a `textColor` prop (iOS-specific), set it:
   ```tsx
   textColor={colors.text}
   ```

### DateInputField
**File:** `components/DateInputField.tsx`

7. Same as above — import `useColorScheme`, define `colors`, and replace:
   - `borderColor: "#E0E0E0"` → `borderColor: colors.border`
   - `backgroundColor: "#fff"` → `backgroundColor: colors.background`
   - `color: "#333"` → `color: colors.text`
   - Any placeholder text color → `colors.subtext`

8. Also apply `colors.text` to any `<Text>` labels inside this component that use hardcoded colors.

---

> End of app specs.
