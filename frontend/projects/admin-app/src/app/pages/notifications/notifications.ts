import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminAccount, NotificationSettings, TestNotificationResult } from '@dekora/shared';
import { NotificationSettingsApi } from '../../core/api/notification-settings.api';
import { AuthApi } from '../../core/auth/auth.api';

@Component({
  selector: 'app-notifications',
  imports: [FormsModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications {
  private readonly api = inject(NotificationSettingsApi);
  private readonly authApi = inject(AuthApi);

  protected readonly settings = signal<NotificationSettings>({
    emailEnabled: false,
    emailAddress: null,
    whatsAppEnabled: false,
    whatsAppNumber: null,
    telegramEnabled: false,
    telegramHandle: null,
  });
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);

  protected readonly testing = signal(false);
  protected readonly testResult = signal<TestNotificationResult | null>(null);

  // Team access — the owner can add another admin account here; there's no other way to get
  // the Admin role since public sign-up always creates a Customer account.
  protected readonly admins = signal<AdminAccount[]>([]);
  protected readonly newAdminName = signal('');
  protected readonly newAdminEmail = signal('');
  protected readonly newAdminPassword = signal('');
  protected readonly creatingAdmin = signal(false);
  protected readonly adminError = signal<string | null>(null);

  constructor() {
    this.api.get().subscribe((settings) => this.settings.set(settings));
    this.reloadAdmins();
  }

  private reloadAdmins(): void {
    this.authApi.getAdmins().subscribe((admins) => this.admins.set(admins));
  }

  protected updateField<K extends keyof NotificationSettings>(field: K, value: NotificationSettings[K]): void {
    this.settings.update((s) => ({ ...s, [field]: value }));
  }

  protected save(): void {
    this.saving.set(true);
    this.saved.set(false);
    this.api.update(this.settings()).subscribe(() => {
      this.saving.set(false);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2000);
    });
  }

  // Sends a real message through every enabled-and-configured channel using whatever's
  // currently saved on the server — so this always tests the settings actually in effect, not
  // whatever's mid-edit in the form. Saving first avoids testing a stale channel.
  protected sendTest(): void {
    this.testing.set(true);
    this.testResult.set(null);
    this.api.update(this.settings()).subscribe(() => {
      this.api.sendTest().subscribe((result) => {
        this.testing.set(false);
        this.testResult.set(result);
      });
    });
  }

  protected createAdmin(): void {
    const fullName = this.newAdminName().trim();
    const email = this.newAdminEmail().trim();
    const password = this.newAdminPassword();
    if (!fullName || !email || !password) return;

    this.creatingAdmin.set(true);
    this.adminError.set(null);
    this.authApi.createAdmin({ fullName, email, password }).subscribe({
      next: () => {
        this.creatingAdmin.set(false);
        this.newAdminName.set('');
        this.newAdminEmail.set('');
        this.newAdminPassword.set('');
        this.reloadAdmins();
      },
      error: (err) => {
        this.creatingAdmin.set(false);
        this.adminError.set(this.describeCreateAdminError(err));
      },
    });
  }

  // ASP.NET Identity reports password-policy violations as { errors: { Code: [Description] } }
  // (see AuthController.CreateAdmin's ValidationProblem) and a duplicate email as a plain
  // { message }. Surfacing the real description beats a generic "something went wrong".
  private describeCreateAdminError(err: unknown): string {
    const httpErr = err as { error?: { message?: string; errors?: Record<string, string[]> } };
    if (httpErr?.error?.errors) {
      const descriptions = Object.values(httpErr.error.errors).flat();
      if (descriptions.length) return descriptions.join(' ');
    }
    return httpErr?.error?.message ?? 'Could not create that account.';
  }
}
