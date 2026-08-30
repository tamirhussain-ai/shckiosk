import type { KioskContent } from "@workspace/api-zod";

export const kioskContentDefaults: KioskContent = {
  welcome: {
    eyebrow: "Start your check-in",
    title: "Welcome, Hoosier.",
    titleAccent: "Thank you for trusting us with your care.",
    description:
      "Check in for your visit in a few simple steps. Take your time — your health information stays private throughout.",
    duration: "About 2 minutes",
    durationNote: "No paperwork to carry.",
    startEyebrow: "Start your check-in",
    startTitle: "How would you like to begin?",
    privacyNote: "For your privacy, please use this screen alone.",
    demoInstructions:
      "Demo: use iu123456 for scheduled visits or iu000000 for no scheduled appointment, with 10/14/2003.",
    qrPrompt: "Use the QR code from your text",
    qrDescription:
      "This demo simulates the iPad camera using a sample QR token. No image is captured or stored.",
    findVisitButton: "Find my visit",
    qrButton: "Use demo QR code",
  },
  appointment: {
    scheduledHeading: "Which appointment are you checking in for?",
    scheduledDescription: "Choose the appointment you're here for today.",
    confirmButton: "Confirm appointment",
    noAppointmentHeading: "No scheduled appointment found",
    noAppointmentDescription:
      "You can still get help today. Choose the option that works best for you.",
    frontDeskLabel: "Visit the front desk",
    frontDeskDescription:
      "A team member can look for your visit or help you make an appointment.",
    scheduleLabel: "Schedule online",
    scheduleDescription: "Use the self-service scheduler QR code or link.",
    frontDeskConfirmation:
      "Please take your student ID to the front desk. You do not need to enter more information here.",
    schedulingHeading: "Schedule an appointment online",
    schedulingUnavailable:
      "The scheduler connection is not available on this kiosk. Ask the front desk for the current scheduling QR code or link.",
    backToOptionsButton: "Back to appointment options",
  },
  details: {
    heading: "Contact details",
    continueButton: "Looks good",
  },
  coverage: {
    heading: "Billing & Coverage",
    description: "Choose the option that best describes your plan today.",
    selfPayTitle: "Self Pay",
    selfPayDescription: "No insurance plan will be billed for this visit.",
    iuOptionTitle: "Bill IU Student Insurance",
    iuOptionDescription: "We have your plan on file.",
    otherOptionTitle: "Bill a different insurance plan",
    otherOptionDescription: "Enter the information from your insurance card.",
    insuranceHeading: "Insurance information",
    updateInsuranceButton: "Return and update insurance information",
    viewInsuranceButton: "View insurance information",
    confirmButton: "Confirm coverage",
  },
  consent: {
    heading: "Consent to Treat",
    noticeFirstParagraph:
      "By proceeding, I voluntarily consent to medical care, diagnostic procedures, and treatment by IU Student Health Center personnel. I understand that I have the right to ask questions about my treatment and discuss any concerns with my provider.",
    noticeSecondParagraph:
      "I also acknowledge receipt of the Notice of Privacy Practices, detailing how my health information may be used and disclosed.",
    agreementLabel: "I have read and agree to the Consent to Treat",
    signatureLabel: "Type your full name to sign",
    signaturePlaceholder: "Your name",
    continueButton: "Sign and continue",
  },
  questions: {
    heading: "Pre-visit questions",
    description: "Your answers help us prepare for a more useful conversation.",
    continueButton: "Save answers",
  },
  checking: {
    heading: "Finishing up...",
    description: "Securely saving your responses.",
  },
  complete: {
    badge: "Check-in complete",
    kioskFloorPrefix: "This kiosk is on the",
    directionsSuffix: "Your visit is ready for you.",
    destinationFallback: "Destination",
    waitingAreaFallback: "Waiting Area",
    visitConfirmed: "Visit confirmed",
    providerLabel: "Provider",
    visitLabel: "Visit",
    timeLabel: "Time",
    doneButton: "Done",
    demoNotice: "Demo / sample data only. No patient information is displayed.",
  },
};