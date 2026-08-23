import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthApi } from '../../core/auth/auth.api';
import { describeAuthError } from '../../core/auth/auth-error.util';
import { passwordPolicyValidator, passwordRuleStatus } from '../../core/auth/password-policy.validator';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  private readonly authApi = inject(AuthApi);
  private readonly route = inject(ActivatedRoute);
  protected readonly translation = inject(TranslationService);

  private readonly queryParams = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  protected readonly email = computed(() => this.queryParams().get('email') ?? '');
  protected readonly token = computed(() => this.queryParams().get('token') ?? '');
  protected readonly hasValidLink = computed(() => !!this.email() && !!this.token());

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessages = signal<string[]>([]);

  protected readonly form = new FormGroup(
    {
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, passwordPolicyValidator()],
      }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: passwordsMatchValidator },
  );

  private readonly passwordValue = toSignal(this.form.controls.newPassword.valueChanges, { initialValue: '' });
  protected readonly passwordRules = computed(() => passwordRuleStatus(this.passwordValue()));

  protected submit(): void {
    if (this.form.invalid || !this.hasValidLink()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessages.set([]);

    this.authApi
      .resetPassword({ email: this.email(), token: this.token(), newPassword: this.form.getRawValue().newPassword })
      .subscribe({
        next: () => {
          this.submitted.set(true);
          this.submitting.set(false);
        },
        error: (err) => {
          // A plain 400 with a { message } body (not Identity's { errors } dictionary) means
          // the backend couldn't find a matching account for this token — i.e. the link itself
          // is bad, not a password-policy violation.
          const isBadLink = err instanceof HttpErrorResponse && err.status === 400 && !err.error?.errors;
          this.errorMessages.set(isBadLink ? ['authPage.errorInvalidToken'] : describeAuthError(err));
          this.submitting.set(false);
        },
      });
  }
}
