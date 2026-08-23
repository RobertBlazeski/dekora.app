import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthApi } from '../../core/auth/auth.api';
import { describeAuthError } from '../../core/auth/auth-error.util';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-forgot-password',
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private readonly authApi = inject(AuthApi);
  protected readonly translation = inject(TranslationService);

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessages = signal<string[]>([]);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessages.set([]);

    this.authApi.forgotPassword(this.form.getRawValue()).subscribe({
      // The backend always returns 200 here (even for an unknown email) to avoid revealing
      // which addresses have accounts — so "submitted" is the only outcome on success.
      next: () => {
        this.submitted.set(true);
        this.submitting.set(false);
      },
      error: (err) => {
        this.errorMessages.set(describeAuthError(err));
        this.submitting.set(false);
      },
    });
  }
}
