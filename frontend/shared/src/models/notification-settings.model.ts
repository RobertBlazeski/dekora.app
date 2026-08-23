export interface NotificationSettings {
  emailEnabled: boolean;
  emailAddress: string | null;
  whatsAppEnabled: boolean;
  whatsAppNumber: string | null;
  telegramEnabled: boolean;
  telegramHandle: string | null;
}

// Null on a channel means it wasn't tested (disabled, or missing its address/chat ID) — distinct
// from `false`, which means it was tried and failed.
export interface TestNotificationResult {
  emailSuccess: boolean | null;
  emailError: string | null;
  telegramSuccess: boolean | null;
  telegramError: string | null;
}
