export interface NotificationSettings {
  emailEnabled: boolean;
  emailAddress: string | null;
  whatsAppEnabled: boolean;
  whatsAppNumber: string | null;
  telegramEnabled: boolean;
  telegramHandle: string | null;
}
