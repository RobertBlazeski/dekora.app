import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { describeAuthError } from '../../core/auth/auth-error.util';
import { passwordPolicyValidator, passwordRuleStatus } from '../../core/auth/password-policy.validator';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-signup',
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly translation = inject(TranslationService);

  protected readonly submitting = signal(false);
  protected readonly errorMessages = signal<string[]>([]);

  protected readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, passwordPolicyValidator()],
    }),
    phone: new FormControl('', { nonNullable: true }),
  });

  private readonly passwordValue = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  protected readonly passwordRules = computed(() => passwordRuleStatus(this.passwordValue()));

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessages.set([]);

    const value = this.form.getRawValue();
    this.auth.register({ ...value, phone: value.phone || null }).subscribe({
      next: () => this.router.navigate(['/', this.translation.currentLocale(), 'profile']),
      error: (err) => {
        this.errorMessages.set(describeAuthError(err));
        this.submitting.set(false);
      },
    });
  }
}
